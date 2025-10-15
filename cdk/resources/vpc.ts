import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { env } from "~/env";

export class Vpc extends Construct {
  // 別スタックから参照できるようにする
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnetAZ1: ec2.Subnet;
  public readonly privateSubnetAZ1: ec2.Subnet;
  public readonly bedrockAgentRuntimeEndpoint: ec2.InterfaceVpcEndpoint;

  // VPC作成
  constructor(scope: Construct, id: string) {
    super(scope, id);
    /**
     * VPC作成
     */
    this.vpc = new ec2.Vpc(this, "VPC", {
      vpcName: env.vpc.name,
      ipAddresses: ec2.IpAddresses.cidr(env.vpc.cidr),
      availabilityZones: Object.values(env.vpc.azs),
      restrictDefaultSecurityGroup: true,
      subnetConfiguration: [],
      natGateways: 0,
    });

    /**
     * インターネットゲートウェイ作成
     */
    const igw = new ec2.CfnInternetGateway(this, "InternetGateway", {});
    // VPCにアタッチ
    new ec2.CfnVPCGatewayAttachment(this, "VpcGatewayAttachment", {
      vpcId: this.vpc.vpcId,
      internetGatewayId: igw.ref,
    });

    /**
     * サブネット作成
     * 個別に作るとcidrを指定できる
     */
    this.publicSubnetAZ1 = new ec2.PublicSubnet(this, "publicSubnetAZ1", {
      vpcId: this.vpc.vpcId,
      cidrBlock: env.subnet.publicCidrAZ1,
      availabilityZone: env.vpc.azs.az1,
      mapPublicIpOnLaunch: true,
    });

    this.privateSubnetAZ1 = new ec2.PublicSubnet(this, "privateSubnetAZ1", {
      vpcId: this.vpc.vpcId,
      cidrBlock: env.subnet.privateCidrAZ1,
      availabilityZone: env.vpc.azs.az1,
      mapPublicIpOnLaunch: true,
    });

    /**
     * パブリックサブネット用にルートテーブル作成
     */
    // パブリックサブネット1用のルートテーブルの作成
    const publicRouteTable = new ec2.CfnRouteTable(this, "publicRouteTable", {
      vpcId: this.vpc.vpcId,
    });

    // ルートテーブルにインターネットゲートウェイのルート追加
    new ec2.CfnRoute(this, "publicRoute", {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.ref,
    });

    // ルートテーブルとサブネット関連付け
    new ec2.CfnSubnetRouteTableAssociation(this, "SubnetRouteTableAssociation1", {
      subnetId: this.publicSubnetAZ1.subnetId,
      routeTableId: publicRouteTable.ref,
    });

    /**
     * プライベート用のルート作成
     */
    const privateRouteTable = new ec2.CfnRouteTable(this, "PrivateRouteTable", {
      vpcId: this.vpc.vpcId,
    });

    new ec2.CfnSubnetRouteTableAssociation(this, "PrivateSubnetRouteTableAssociation1", {
      subnetId: this.privateSubnetAZ1.subnetId,
      routeTableId: privateRouteTable.ref,
    });

    /**
     * Bedrock Agent RuntimeのVPCエンドポイント作成
     */
    // セキュリティグループ作成（VPCからのHTTPSアクセスを許可）
    const bedrockEndpointSG = new ec2.SecurityGroup(this, "BedrockAgentRuntimeEndpointSG", {
      vpc: this.vpc,
      description: "Security group for Bedrock Agent Runtime VPC Endpoint",
      allowAllOutbound: false,
    });

    // VPCのCIDR範囲からのHTTPSアクセスを許可
    bedrockEndpointSG.addIngressRule(
      ec2.Peer.ipv4(env.vpc.cidr),
      ec2.Port.tcp(443),
      "Allow HTTPS from VPC"
    );

    // Bedrock Agent Runtime VPCエンドポイントの作成
    this.bedrockAgentRuntimeEndpoint = new ec2.InterfaceVpcEndpoint(
      this,
      "BedrockAgentRuntimeEndpoint",
      {
        vpc: this.vpc,
        service: new ec2.InterfaceVpcEndpointService(
          `com.amazonaws.${env.region}.bedrock-agent-runtime`
        ),
        subnets: {
          subnets: [this.privateSubnetAZ1],
        },
        securityGroups: [bedrockEndpointSG],
        privateDnsEnabled: true,
      }
    );
  }
}