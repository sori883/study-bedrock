import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as path from "path";

interface CloudFrontDistributionProps {
  functionUrl: lambda.FunctionUrl;
  lambdaFunction: lambda.IFunction;
  edgeFunctionVersion: lambda.IVersion;
}

export class CloudFrontDistribution extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontDistributionProps) {
    super(scope, id);

    // FunctionUrlOrigin.withOriginAccessControl()を使用してOAC統合
    const origin = origins.FunctionUrlOrigin.withOriginAccessControl(
      props.functionUrl,
      {
        connectionTimeout: cdk.Duration.seconds(6),
        readTimeout: cdk.Duration.seconds(60),
      }
    );

    // Function の作成
    const cloudfrontFunction = new cloudfront.Function(
      this,
      "Function",
      {
        code: cloudfront.FunctionCode.fromFile({
          filePath: path.join(__dirname, "cloud-functions/function.js"),
        }),
        runtime: cloudfront.FunctionRuntime.JS_2_0
      }
    );

    // カスタムOrigin Request Policyを作成
    const originRequestPolicy = new cloudfront.OriginRequestPolicy(
      this,
      "ForwardOriginalHost",
      {
        originRequestPolicyName: "ForwardOriginalHost",
        comment: "Forward X-Original-Host to Lambda Function URL",
        headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
          "X-Original-Host"
        ),
        cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
        queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
      }
    );

    // CloudFront Distribution作成
    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: originRequestPolicy,
        // CloudFront FunctionをViewer Requestで実行
        functionAssociations: [
          {
            function: cloudfrontFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
        // Lambda@EdgeでOrigin Requestイベントを処理
        edgeLambdas: [
          {
            functionVersion: props.edgeFunctionVersion,
            eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            includeBody: true, // リクエストボディをLambda@Edgeに渡す
          },
        ],
      },
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      comment: "CloudFront distribution for Next.js on Lambda with OAC",
    });
  }
}
