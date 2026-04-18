const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const tls = require("@pulumi/tls");
const fs = require("fs");
const path = require("path");

const config = new pulumi.Config();
const appName = config.get("appName") || "coelor";

// Generate SSH key pair
const sshKey = new tls.PrivateKey("ssh-key", {
    algorithm: "RSA",
    rsaBits: 4096,
});

// Register public key with AWS
const keyPair = new aws.ec2.KeyPair("ec2-key-pair", {
    keyName: `${appName}-key`,
    publicKey: sshKey.publicKeyOpenssh,
});

// Security group — SSH, HTTP, HTTPS inbound; all outbound
const securityGroup = new aws.ec2.SecurityGroup("app-sg", {
    name: `${appName}-sg`,
    description: "Allow SSH, HTTP, HTTPS",
    ingress: [
        { protocol: "tcp", fromPort: 22,  toPort: 22,  cidrBlocks: ["0.0.0.0/0"], description: "SSH" },
        { protocol: "tcp", fromPort: 80,  toPort: 80,  cidrBlocks: ["0.0.0.0/0"], description: "HTTP" },
        { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"], description: "HTTPS" },
    ],
    egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] },
    ],
    tags: { Name: `${appName}-sg` },
});

// Latest Amazon Linux 2023 AMI in ap-south-1
const ami = aws.ec2.getAmi({
    mostRecent: true,
    owners: ["amazon"],
    filters: [
        { name: "name",                values: ["al2023-ami-*-x86_64"] },
        { name: "virtualization-type", values: ["hvm"] },
        { name: "root-device-type",    values: ["ebs"] },
    ],
});

// EC2 instance (t3.micro — 1GB RAM, free tier eligible)
const instance = new aws.ec2.Instance("app-instance", {
    instanceType: "t3.micro",
    ami: ami.then(a => a.id),
    keyName: keyPair.keyName,
    vpcSecurityGroupIds: [securityGroup.id],
    tags: { Name: appName },
});

// Elastic IP so the IP doesn't change on restart
const eip = new aws.ec2.Eip("app-eip", {
    domain: "vpc",
    tags: { Name: `${appName}-eip` },
});

new aws.ec2.EipAssociation("app-eip-assoc", {
    instanceId: instance.id,
    allocationId: eip.id,
});

// Save PEM file locally after pulumi up
sshKey.privateKeyPem.apply(pem => {
    const pemPath = path.join(__dirname, `${appName}.pem`);
    fs.writeFileSync(pemPath, pem, { mode: 0o600 });
    console.log(`PEM key saved to: ${pemPath}`);
});

exports.publicIp      = eip.publicIp;
exports.instanceId    = instance.id;
exports.keyPairName   = keyPair.keyName;
exports.privateKeyPem = pulumi.secret(sshKey.privateKeyPem);
