#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { env } from "~/env";
import { EdgeStack } from "~/lib/edge-stack";
import { MainStack } from "~/lib/main-stack";
import { BedrockStack } from "~/lib/bedrock-stack"

const app = new cdk.App();

// Lambda@Edge関数（us-east-1リージョンに作成）
const edgeStack = new EdgeStack(app, "EdgeStack", {
  env: {
    account: env.accountId,
    region: "us-east-1", // Lambda@Edgeはus-east-1でのみ作成可能
  },
  crossRegionReferences: true, // クロスリージョン参照を有効化
});

// メインスタック（VPC、Lambda、CloudFront）
const mainStack = new MainStack(app, "MainStack", {
  env: {
    account: env.accountId,
    region: env.region,
  },
  crossRegionReferences: true, // クロスリージョン参照を有効化
  edgeFunctionVersion: edgeStack.edgeFunction.functionVersion,
});


/**
 * 一応作成したbedrock
 * CDKで作成することで、エージェントIDとエイリアスIDをLambda環境変数として渡せる
 */
// // BedrockStack
// const bedrockStack = new BedrockStack(app, "BedrockStack", {
//   env: {
//     account: env.accountId,
//     region: env.region,
//   },
// });
