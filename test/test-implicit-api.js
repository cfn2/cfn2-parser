const test = require('tape');
const { readTemplate } = require('cfn-read-template');
const { makeTemplateParser } = require('..');

test('test parseTemplate: implicit-api', t => {
  t.plan(9);

  readTemplate(`${__dirname}/test-implicit-api.yaml`, (err, template) => {
    t.error(err);

    const context = {
      Parameters: {
        'AWS::AccountId': {
          Value: '123456789012',
        },
        'AWS::Region': {
          Value: 'us-west-2',
        },
      },
    };

    makeTemplateParser({
      anyResourceTypeParser: async (dataRef, context) => {
        t.equal(dataRef.data.Type, 'AWS::Serverless::Api');
      },
      resourceTypeParsers: {
        'AWS::Serverless::Function': async (dataRef, context) => {
          t.equal(dataRef.data.Type, 'AWS::Serverless::Function');
        },
      },
    })(template, context, (err, result) => {
      t.error(err);

      t.deepEqual(Object.keys(context.Resources),
        [ 'HelloFunction', 'ServerlessRestApi' ]);

      const implicitApi = context.Resources['ServerlessRestApi'];

      t.equal(typeof implicitApi, 'object');
      t.equal(implicitApi.Type, 'AWS::Serverless::Api');
      t.equal(typeof implicitApi.Properties, 'object');
      t.equal(typeof implicitApi.Properties.DefinitionBody, 'object');
    });
  });
});
