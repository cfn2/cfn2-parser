const test = require('tape');
const { loadTemplates } = require('./templates');
const { makeTemplateParser } = require('..');

loadTemplates(({ implicitApi }) => {
  test('test parseTemplate: implicitApi', t => {
    t.plan(8);

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
    })(implicitApi, context, (err, result) => {
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
