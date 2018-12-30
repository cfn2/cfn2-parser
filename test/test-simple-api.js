const test = require('tape');
const { readTemplate } = require('cfn-read-template');
const { makeTemplateParser } = require('..');

test('test parseTemplate: simple-api', t => {
  t.plan(6);

  readTemplate(`${__dirname}/test-simple-api.yaml`, (err, template) => {
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
        [ 'HelloApi', 'HelloFunction' ]);
      t.equal(context.Globals.Function.Timeout, 10);
    });
  });
});
