import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { TmPipelineInfraStage } from './tm-infra-stage';


export class TmPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);



    const pipeline = new pipelines.CodePipeline(this, 'TmPipelineStackDevLcarvalho', {
        crossAccountKeys: true,
        pipelineName: 'TmPipelineStackDevLcarvalho',
        synth: new pipelines.CodeBuildStep('Synth', {
            input: pipelines.CodePipelineSource.gitHub('luciocarvalhojr/solr-env', 'main', {
                authentication: cdk.SecretValue.secretsManager('GITHUB_TOKEN_NAME'),
            }),
            // Commands to run in the synth step
            installCommands: ['npm install', 'npm ci', 'npm install -g aws-cdk'],
            commands: [
                'npm install',
                'cdk synth',
            ],
            primaryOutputDirectory: './cdk.out',
            rolePolicyStatements: [
                new iam.PolicyStatement({
                    actions: [
                        'ec2:DescribeAvailabilityZones',
                        'ssm:GetParameter',
                    ],
                    resources: ['*'],
                }),
            ],
        }),
    });

    const infraStage = new TmPipelineInfraStage(this, 'InfraStage', {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: 'ca-central-1'
        }
    });

    const postInfraStage = new pipelines.CodeBuildStep('PostInfraStage', {
        commands: [
            'echo "Post Infra Stage"',
            // Add any post-infra commands here
        ],
        rolePolicyStatements: [
            new iam.PolicyStatement({
                actions: ['ec2:DescribeInstances'],
                resources: ['*'],
            }),
        ],
    });

    pipeline.addStage(infraStage, {
        post: [postInfraStage], 
    });

    }
}