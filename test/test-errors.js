const test = require('tape');
const { readTemplate } = require('@cfn2/read-template');
const { makeTemplateParser } = require('..');

test('test parseTemplate: errors', t => {
  t.plan(7);

  readTemplate(`${__dirname}/test-errors.yaml`, (err, template) => {
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

    makeTemplateParser()(template, context, (err, result) => {
      t.ok(err);

      t.equal(context.errors.length, 4);

      for (const err of context.errors) {
        t.equal(err.code, 'ERR_PROHIBITED_PROPERTY');
      }
    });
  });
});
