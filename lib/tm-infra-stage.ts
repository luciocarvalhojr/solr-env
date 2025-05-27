import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { TmVpcBaseStack } from './tm-vpc-base-stack';
import { TmSolrEc2Stack } from './tm-solr-ec2-stack';

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

    const vpc = new TmVpcBaseStack(this, `TmVpc${regionName}Stack`, {
        env: env,
        range: '10.98.0.0/16',
        hostedZoneName: 'tm-via-tm-pipeline.internal',
    });

    new TmSolrEc2Stack(this, `TmSolrEc2${regionName}Stack`, {
        vpc: vpc.vpc,
        hostedZone: vpc.hostedZone,
        env: env,
        crossRegionReferences: true,
    });

    }
}