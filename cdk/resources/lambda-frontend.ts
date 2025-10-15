import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { Vpc } from "./vpc";
import { env } from "../env";

const dockerPath = path.join(__dirname, "../../frontend/");

interface FrontendLambdaProps {
  vpc: Vpc;
}

export class FrontendLambda extends Construct {
  public readonly function: lambda.DockerImageFunction;
  public readonly functionUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props: FrontendLambdaProps) {
    super(scope, id);

    // セキュリティグループ
    const securityGroup = new ec2.SecurityGroup(this, "FrontendLambdaSG", {
      vpc: props.vpc.vpc,
      description: "Security group for Frontend Lambda",
      allowAllOutbound: true,
    });

    new ec2.CfnSecurityGroupIngress(scope, "FrontendLambdaSGIngress", {
      groupId: securityGroup.securityGroupId,
      ipProtocol: "tcp",
      cidrIp: "0.0.0.0/0",
      fromPort: 0,
      toPort: 65535,
    });

    this.function = new lambda.DockerImageFunction(this, "Frontendfunction", {
      code: lambda.DockerImageCode.fromImageAsset(dockerPath, {
        platform: Platform.LINUX_AMD64,
      }),
      timeout: cdk.Duration.seconds(300),
      memorySize: 1024,
      vpc: props.vpc.vpc,
      vpcSubnets: {
        subnets: [props.vpc.privateSubnetAZ1],
      },
      securityGroups: [securityGroup],
      environment: {
        AWS_LWA_INVOKE_MODE: "response_stream",
        PORT: "8080",
        BEDROCK_AGENT_ID: env.bedrockAgentId,
        AGENT_ALIAS_ID: env.agentAliasId
      },
    });

    // AmazonBedrockFullAccess マネージドポリシーを付与
    this.function.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess")
    );

    // 関数URLでアクセスする
    this.functionUrl = this.function.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
    });
  }
}