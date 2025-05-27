#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TmVpcBaseStack } from '../lib/tm-vpc-base-stack';
import { TmSolrEc2Stack } from '../lib/tm-solr-all-in-stack';
import { TmPipelineStack } from '../lib/tm-pipeline-stack';

const app = new cdk.App();

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

const vpc = new TmVpcBaseStack(app, `TmVpc${regionName}Stack`, {
  env: env,
  range: '10.99.0.0/16',
  hostedZoneName: 'tm-dev-lcarvalho.internal',
});

new TmSolrEc2Stack(app, `TmSolrEc2${regionName}Stack`, {
  vpc: vpc.vpc,
  hostedZone: vpc.hostedZone,
  env: env,
  crossRegionReferences: true,
});

new TmPipelineStack(app, 'TmPipelineStackDevLcarvalho', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ca-central-1',
  },
});

app.synth();