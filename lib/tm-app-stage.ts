import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';

export class TmPipelineInfraStage extends cdk.Stage {

    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
        super(scope, id, props);   

    function toPascalCase(input: string): string {
        return input
        .split(/[\s_\-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    }

    const region = 'ca-central-1';
    const regionName = toPascalCase(region);

    const env = {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
    };

    // CodeDeploy application
    const codedeployApp = new codedeploy.ServerApplication(this, 'SolrApp', {
        applicationName: 'SolrApp',
    });

    const codedeployRole = new iam.Role(this, 'CodeDeployServiceRole', {
        assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployFullAccess'),
        ],
    });

// Deployment group that targets instances with Name=CodeDeployInstance
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'SolrDeploymentGroup', {
        application: codedeployApp,
        deploymentGroupName: 'SolrDeploymentGroup',
        ec2InstanceTags: new codedeploy.InstanceTagSet({ CodeDeploy: ['CodeDeployInstance'] }),
        installAgent: false,
        role: codedeployRole,
    });

    // Pipeline source from GitHub
    const artifactBucket = new s3.Bucket(this, 'ArtifactsBucket');
    const sourceOutput = new codepipeline.Artifact();

    }
}