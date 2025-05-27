import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';


interface TmSolrEc2StackPropos extends cdk.StackProps {
    vpc: ec2.IVpc;
    hostedZone?: route53.IHostedZone;
    instanceSize?: string;
    ebsVolumeSize?: number;
}

export class TmSolrEc2Stack extends cdk.Stack {

    public readonly securityGroup: ec2.ISecurityGroup;

    constructor(scope: Construct, id: string, props: TmSolrEc2StackPropos) {
        super(scope, id, props);

        const playbookBucket = new s3.Bucket(this, 'PlaybookBucket', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        const playbookAssetPath = './lib/ansible-playbook/'; // Path to your Ansible playbook
        new s3Deployment.BucketDeployment(this, 'DeployPlaybook', {
            sources: [s3Deployment.Source.asset(playbookAssetPath)],
            destinationBucket: playbookBucket,
        });

        const ebsVolumeSize = props.ebsVolumeSize || 20;
        const instanceSize = props.instanceSize || 't3.medium';

        this.securityGroup = new ec2.SecurityGroup(this, 'SolrSecurityGroup', {
            vpc: props.vpc,
            allowAllOutbound: true,
        });
        
        const pinnedMachineImage = ec2.MachineImage.genericLinux({
            'ca-central-1': 'ami-0d13170a36bc1b384',
        });

        const solr = new ec2.Instance(this, 'Solr', {
            instanceType: new ec2.InstanceType(instanceSize),
            machineImage: pinnedMachineImage,
            vpc: props.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,  // Launch EC2 in public subnet
            },
            securityGroup: this.securityGroup,
            blockDevices: [{
                deviceName: '/dev/xvda',                               // Device name in the instance
                volume: ec2.BlockDeviceVolume.ebs( ebsVolumeSize , {  // 20 GB EBS volume
                    volumeType: ec2.EbsDeviceVolumeType.GP3,            // Specify gp3 volume type                          
                    deleteOnTermination: false,                         // Delete the volume when the instance is terminated
                    encrypted: true,                                    // Enable encryption
                }),
            }],
        });

        solr.role.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
        );

        solr.role.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
        );

        solr.instance.addPropertyOverride('Tags', [
            {
                Key: 'CodeDeploy',
                Value: 'CodeDeployInstance',
            },
            {
                Key: 'solr',
                Value: 'true',
            },
            {
                Key: 'tag-key',
                Value: 'solr',
            },
        ]);

        /*
        new ssm.CfnPatchBaseline(this, 'UpdateOperatingSystem', {
            name: 'UpdateOperatingSystem',
            tags: [{
                key: 'solr',
                value: 'true',
            }],
            operatingSystem: 'AMAZON_LINUX_2023',
        });
        */

        const parametersAnsible = {
            SourceType: [
                'GitHub'
            ],
            SourceInfo: [
                JSON.stringify({
                    'owner':'luciocarvalhojr',
                    'repository':'ansible-playbook',
                    'path':'install-docker-redhat.yml',
                    'getOptions':'branch:main'
                })
            ],
            InstallDependencies: [
                'True'
            ],
            PlaybookFile: [
                'install-docker-redhat.yml'
            ],
            Check: [
                'False'
            ],
            Verbose: [
                '-v'
            ]
        };

        const listOfAwsPackages = [
            'AWSCodeDeployAgent',
            'AmazonCloudWatchAgent',
        ]

        for (const packageName of listOfAwsPackages) {
            const parametersPackage = {
                action: [
                    'Install'
                ],
                name: [
                    `${packageName}`
                ],
            };

            new ssm.CfnAssociation(this, `Configure${packageName}Association`, {
            name: 'AWS-ConfigureAWSPackage',
            parameters: parametersPackage,
            targets: [
                {
                    key: 'tag:solr',
                    values: ['true'],
                },
            ],
            associationName: `Install-${packageName}-${String(Date.now())}`,
            applyOnlyAtCronInterval: false,
            waitForSuccessTimeoutSeconds: 600,
            maxErrors: '3',
        });
        }

        new ssm.CfnAssociation(this, 'AnsiblePlaybookAssociation', {
            name: 'AWS-ApplyAnsiblePlaybooks', // Required document name
            parameters: parametersAnsible,
            targets: [
                {
                    key: 'tag:solr',
                    values: ['true'],
                },
            ],
            associationName: `Install-DockerAnsible-${String(Date.now())}`,
            applyOnlyAtCronInterval: false,
            waitForSuccessTimeoutSeconds: 600,
            maxErrors: '3',
        });

        playbookBucket.grantRead(solr.role);

        // CodeDeploy application
        const codedeployApp = new codedeploy.ServerApplication(this, 'CodeDeployApp', {
            applicationName: 'SolrService',
        });

        const codedeployRole = new iam.Role(this, 'CodeDeployServiceRole', {
            assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployFullAccess'),
            ],
        });

        // Deployment group that targets instances with Name=CodeDeployInstance
        const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'CodeDeployGroup', {
            application: codedeployApp,
            deploymentGroupName: 'MyCodeDeployGroup',
            ec2InstanceTags: new codedeploy.InstanceTagSet({ CodeDeploy: ['CodeDeployInstance'] }),
            installAgent: false,
            role: codedeployRole,
        });

        // Pipeline source from GitHub
        const artifactBucket = new s3.Bucket(this, 'ArtifactsBucket');
        const sourceOutput = new codepipeline.Artifact();

        const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
            artifactBucket,
        pipelineName: 'EC2DeployPipeline',
        });

        pipeline.addStage({
        stageName: 'Source',
        actions: [
            new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'luciocarvalhojr',
            repo: 'solr-env',
            oauthToken: cdk.SecretValue.secretsManager('GITHUB_TOKEN_NAME'),
            output: sourceOutput,
            branch: 'main',
            }),
        ],
        });

        pipeline.addStage({
        stageName: 'Deploy',
        actions: [
            new codepipeline_actions.CodeDeployServerDeployAction({
            actionName: 'CodeDeploy',
            input: sourceOutput,
            deploymentGroup,
            }),
        ],
        });

        if (props.hostedZone) {
            const privateHostedZone = props.hostedZone;
            const route53Record = new route53.ARecord(this, 'SolrRecord', {
                zone: privateHostedZone,
                target: route53.RecordTarget.fromIpAddresses(solr.instancePrivateIp),
                recordName: 'solr', // Will create solr.example.internal
            })

            new ssm.StringParameter(this, 'EndpointSolrWrite', {
                parameterName: '/Solr/Endpoint/Write',
                stringValue: route53Record.domainName,
            });
        }

    }
}