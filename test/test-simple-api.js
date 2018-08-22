const test = require('tape');
const { loadTemplates } = require('./templates');
const { makeTemplateParser } = require('..');

loadTemplates(({ simpleApi }) => {
  test('test parseTemplate: simpleApi', t => {
    t.plan(5);

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
    })(simpleApi, context, (err, result) => {
      t.error(err);

      t.deepEqual(Object.keys(context.Resources),
        [ 'HelloApi', 'HelloFunction' ]);
      t.equal(context.Globals.Function.Timeout, 10);
    });
  });
});
