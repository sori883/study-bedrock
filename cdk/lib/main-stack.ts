import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Vpc } from "../resources/vpc";
import { FrontendLambda } from "../resources/lambda-frontend";
import { CloudFrontDistribution } from "../resources/cloudfront";

interface MainStackProps extends StackProps {
  edgeFunctionVersion: lambda.IVersion;
}

export class MainStack extends Stack {
  public readonly vpc: Vpc;
  public readonly frontendLambda: FrontendLambda;
  public readonly cloudfront: CloudFrontDistribution;

  constructor(scope: Construct, id: string, props: MainStackProps) {
    super(scope, id, props);

    // VPCリソースを作成
    this.vpc = new Vpc(this, "VPC");

    // Frontend Lambdaを作成
    this.frontendLambda = new FrontendLambda(this, "FrontendLambda", {
      vpc: this.vpc,
    });

    // CloudFront Distributionを作成（OAC統合）
    this.cloudfront = new CloudFrontDistribution(this, "CloudFront", {
      functionUrl: this.frontendLambda.functionUrl,
      lambdaFunction: this.frontendLambda.function,
      edgeFunctionVersion: props.edgeFunctionVersion,
    });

    // CloudFront URLを出力
    new CfnOutput(this, "CloudFrontURL", {
      value: `https://${this.cloudfront.distribution.distributionDomainName}`,
      description: "CloudFront Distribution URL (with OAC)",
      exportName: "CloudFrontURL",
    });
  }
}
