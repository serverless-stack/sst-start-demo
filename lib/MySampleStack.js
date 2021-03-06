import * as cdk from "@aws-cdk/core";
import * as sns from "@aws-cdk/aws-sns";
import * as apig from "@aws-cdk/aws-apigatewayv2";
import * as subscriptions from "@aws-cdk/aws-sns-subscriptions";
import * as apigIntegrations from "@aws-cdk/aws-apigatewayv2-integrations";

import * as sst from "@serverless-stack/resources";

export default class MySampleStack extends sst.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create an SNS topic
    const topic = new sns.Topic(this, "MyTopic", {
      displayName: "Customer subscription topic",
    });

    // Create a Lambda function subscribed to the topic
    const snsFunc = new sst.Function(this, "MySnsLambda", {
      handler: "src/sns.handler",
    });
    topic.addSubscription(new subscriptions.LambdaSubscription(snsFunc));

    // Create a Lambda function triggered by an HTTP API
    const apiFunc = new sst.Function(this, "MyApiLambda", {
      handler: "src/api.handler",
      environment: {
        TOPIC_ARN: topic.topicArn,
      },
    });
    topic.grantPublish(apiFunc);

    // Create the HTTP API
    const api = new apig.HttpApi(this, "Api");
    api.addRoutes({
      integration: new apigIntegrations.LambdaProxyIntegration({
        handler: apiFunc,
      }),
      methods: [apig.HttpMethod.GET],
      path: "/",
    });

    // Show API endpoint in output
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: api.apiEndpoint,
    });
  }
}
