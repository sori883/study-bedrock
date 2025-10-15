import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";
import * as path from "path";

export class EdgeFunction extends Construct {
  public readonly functionVersion: lambda.IVersion;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Lambda@Edge用のIAMロールを作成
    // lambda.amazonaws.comとedgelambda.amazonaws.comの両方を信頼する必要がある
    const edgeRole = new iam.Role(this, "EdgeFunctionRole", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
        new iam.ServicePrincipal("edgelambda.amazonaws.com")
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Lambda@Edge関数を作成
    const edgeFunction = new lambda.Function(this, "Function", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "edge-function.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "edge-functions")),
      description: "Add x-amz-content-sha256 header for Lambda Function URL OAC",
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      role: edgeRole, // カスタムロールを使用
    });

    // Lambda@Edgeはバージョン指定が必須
    this.functionVersion = edgeFunction.currentVersion;
  }
}
