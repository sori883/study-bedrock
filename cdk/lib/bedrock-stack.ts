import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam"
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import { agentPrompt } from '../../Prompt/agent-prompt';
/**
 * Bedrock Agentのスタック
 * 一応作った
 */
export class BedrockStack extends Stack {
  public readonly bedrock: bedrock.CfnAgent;
  public readonly agentAlias: bedrock.CfnAgentAlias;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Bedkrock用のロール
    const bedrockAgentRole = new iam.Role(this, "BedrockAgentRole", {
      assumedBy: new iam.ServicePrincipal("bedrock.amazonaws.com"),
      description: "IAM role for Bedrock Agent",
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess")],
    });

    this.bedrock = new bedrock.CfnAgent(this, "BedrockAgent", {
      agentName: "blog-review-agent-2",
      description: "ブログレビューをするエージェントです。",
      foundationModel: "anthropic.claude-3-5-sonnet-20240620-v1:0",
      agentResourceRoleArn: bedrockAgentRole.roleArn,
      instruction: agentPrompt,
      idleSessionTtlInSeconds: 60,
      autoPrepare: true,
    });

    this.agentAlias = new bedrock.CfnAgentAlias(this, "BedrockAgentAlias", {
      agentId: this.bedrock.attrAgentId,
      agentAliasName: "live",
      description: "本番環境用のエイリアス",
    });

  }
}
