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


interface TmPipelineSolrEc2StackProps extends cdk.StackProps {}

export class TmPipelineSolrEc2Stack extends cdk.Stack {

    public readonly securityGroup: ec2.ISecurityGroup;

    constructor(scope: Construct, id: string, props: TmPipelineSolrEc2StackProps) {
        super(scope, id, props);

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
            repo: 'solr',
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

    }
}