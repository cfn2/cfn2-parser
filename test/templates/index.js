const { readTemplate } = require('cfn-read-template');

exports.loadTemplates = callback => {
  const files = [
    'errProhibitedProperty',
    'simpleApi',
  ];

  files.reduceRight((next, file) => templates =>
    readTemplate(`${__dirname}/${file}.yaml`, (err, template) => {
      if (err) {
        throw err;
      }

      templates[file] = template;
      next(templates);
    }),
    callback
  )({});
};
