const { makeTraverser } = require('declarative-traverser');
const {
  ERR_CFN_PARSING_TEMPLATE_FAILED,
} = require('./errors');
const {
  makeSchemaMap,
  schema,
} = require('./schema');

/**
 * Make a template parser.
 */
function makeTemplateParser(options = {}) {
  const traverser = makeTraverser(schema, {
    schemaMap: makeSchemaMap(options),
  });

  return (template, context, callback) => {
    traverser(template, prepareContext(context), (err, context) => {
      if (err) {
        return callback(err);
      }

      if (context.errors.length) {
        const err = ERR_CFN_PARSING_TEMPLATE_FAILED();
        err.errors = context.errors;

        return callback(err);
      }

      callback(null, context);
    });
  };
}

function prepareContext(context) {
  if (!context.Parameters) {
    context.Parameters = {};
  }

  if (!context.Mappings) {
    context.Mappings = {};
  }

  if (!context.Conditions) {
    context.Conditions = {};
  }

  if (!context.Globals) {
    context.Globals = {};
  }

  if (!context.Resources) {
    context.Resources = {};
  }

  if (!context.resourceTypeParsers) {
    context.resourceTypeParsers = {};
  }

  return context;
}

/*
 * Exports.
 */
exports.makeTemplateParser = makeTemplateParser;
