const test = require('tape');
const { loadTemplates } = require('./templates');
const { makeTemplateParser } = require('..');

loadTemplates(({ errProhibitedProperty }) => {
  test('test parseTemplate: errProhibitedProperty', t => {
    t.plan(6);

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

    makeTemplateParser()(errProhibitedProperty, context, (err, result) => {
      t.ok(err);

      t.equal(context.errors.length, 4);

      for (const err of context.errors) {
        t.equal(err.code, 'ERR_PROHIBITED_PROPERTY');
      }
    });
  });
});
