import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "コンテンツが必要です" },
        { status: 400 }
      );
    }

    const credentials = process.env.ACCESS_KEY_ID && process.env.SECRET_ACCESS_KEY ?
    { accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_ACCESS_KEY } :
    undefined; 

    // Bedrockのクライアント
    const client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION,
      credentials
    });

    // エージェントの実行こまんdの
    const command = new InvokeAgentCommand({
      agentId: process.env.BEDROCK_AGENT_ID, // エージェントのID
      agentAliasId: process.env.AGENT_ALIAS_ID, // エージェントエイリアスのID
      sessionId: crypto.randomUUID(),
      inputText: content, // ユーザが入力したプロンプト
      streamingConfigurations: {
        streamFinalResponse: true, // ストリーミングを有効化
      }
    });

    // ストリーミングレスポンスを作成
    const response = await client.send(command);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (response.completion) {
            for await (const chunk of response.completion) {
              console.log("Received chunk:", chunk);
              if (chunk.chunk?.bytes) {
                const text = new TextDecoder().decode(chunk.chunk.bytes);
                console.log("Decoded text:", text);
                controller.enqueue(encoder.encode(text));
                // 少し遅延を入れてストリーミング効果を確認
                await new Promise((resolve) => setTimeout(resolve, 50));
              }
            }
          }
          console.log("Stream completed");
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "レビューの生成に失敗しました" },
      { status: 500 }
    );
  }
}
