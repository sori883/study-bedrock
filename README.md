# study-bedrock

ブログ用のプロジェクトです。
以下、生成AIで概要をざっくり書いてもらいました。

## プロジェクト構成

```
study-bedrock/
├── cdk/                      # AWS CDK インフラストラクチャコード
│   ├── bin/
│   │   └── entrypoint.ts    # CDK アプリケーションのエントリーポイント
│   ├── lib/
│   │   ├── main-stack.ts    # メインスタック定義
│   │   ├── edge-stack.ts    # エッジスタック定義
│   │   └── bedrock-stack.ts # Bedrock スタック定義
│   ├── resources/
│   │   ├── vpc.ts           # VPC と VPC エンドポイント
│   │   ├── lambda-frontend.ts # Next.js Lambda 関数
│   │   ├── cloudfront.ts    # CloudFront 配信設定
│   │   └── edge-function.ts # エッジ関数
│   └── env.ts               # 環境設定
├── frontend/                # Next.js アプリケーション
│   ├── app/                 # App Router
│   │   ├── api/
│   │   │   └── review/
│   │   │       └── route.ts # Bedrock Agent 呼び出し API エンドポイント
│   │   ├── page.tsx         # トップページ
│   │   ├── layout.tsx       # レイアウトコンポーネント
│   │   ├── form-validation.ts # フォームバリデーション
│   │   └── globals.css      # グローバルスタイル
│   ├── public/              # 静的ファイル
│   └── Dockerfile           # Lambda デプロイ用 Docker イメージ
└── Prompt/                  # Bedrock Agent プロンプト
```

## セットアップ

### 1. 環境変数の設定

`cdk/.env` ファイルを作成し、以下の環境変数を設定してください：

```bash
ACCOUNTID=your-aws-account-id
AWS_REGION=your_region
BEDROCK_AGENT_ID=your-bedrock-agent-id
AGENT_ALIAS_ID=your-agent-alias-id
```

`frontend/.env` ファイルを作成し、以下の環境変数を設定してください：

```bash
AWS_REGION=your_region
BEDROCK_AGENT_ID=your_bedrock_agent_id
AGENT_ALIAS_ID=your_agent_alias_id
ACCESS_KEY_ID=your_access_key_id
SECRET_ACCESS_KEY=your_secret_access_key
```

アクセスキー、シークレットキーの指定がない場合は、IAMロールを取得して実行します。

### 2. 依存関係のインストール

```bash
# CDK 依存関係
cd cdk
pnpm install

# フロントエンド依存関係
cd frontend
pnpm install
```

### 3. デプロイ

```bash
cd cdk
pnpm run deploy
```

## 開発

### ローカル開発（フロントエンドのみ）

```bash
cd frontend
pnpm dev
```

http://localhost:3000 でアプリケーションが起動します。


## デプロイされるリソース

- **VPC**: カスタム VPC (10.0.0.0/16)
  - パブリックサブネット (10.0.10.0/24)
  - プライベートサブネット (10.0.12.0/24)
- **VPC Endpoint**: Bedrock Agent Runtime 用のインターフェースエンドポイント
- **Lambda 関数**: Next.js アプリケーションをホスト
- **CloudFront ディストリビューション**: グローバル配信
- **セキュリティグループ**: 適切なアクセス制御
