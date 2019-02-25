const test = require('tape');
const { readTemplate } = require('@cfn2/read-template');
const { makeTemplateParser } = require('..');

test('test parseTemplate: functions', t => {
  t.plan(2);

  readTemplate(`${__dirname}/test-functions.yaml`, (err, template) => {
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
      t.error(err);
    });
  });
});
