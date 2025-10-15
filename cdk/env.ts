export const env = {
  accountId: process.env.ACCOUNTID!,
  bedrockAgentId: process.env.BEDROCK_AGENT_ID!,
  agentAliasId: process.env.AGENT_ALIAS_ID!,
  region: process.env.AWS_REGION!,
  resource: {
    prefix: "prod",
  },
  vpc: {
    name: "myvpc",
    cidr: "10.0.0.0/16",
    azs: {
      az1: "ap-northeast-1a",
      az2: "ap-northeast-1c",
    },
  },
  subnet: {
    publicCidrAZ1: "10.0.10.0/24",
    privateCidrAZ1: "10.0.12.0/24",
  },
};
