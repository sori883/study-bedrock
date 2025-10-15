import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { EdgeFunction } from "../resources/edge-function";

/**
 * Lambda@Edge関数用のスタック
 * Lambda@Edgeはus-east-1リージョンでのみ作成可能
 */
export class EdgeStack extends Stack {
  public readonly edgeFunction: EdgeFunction;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Lambda@Edge関数を作成
    this.edgeFunction = new EdgeFunction(this, "EdgeFunction");
  }
}
