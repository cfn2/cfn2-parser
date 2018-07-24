const {
  CASE,
  DEFAULT,
  IGNORED,
} = require('declarative-traverser');
const {
  applyFunction,
} = require('../intrinsic-functions');
const {
  APPLY_FUNCTION,
  RESOURCE_SCHEMA,
} = require('../symbols');

function makeSchemaMap(options) {
  const schemaMap = {
    [APPLY_FUNCTION]: (dataRef, context, callback) => {
      let data;

      try {
        data = applyFunction(dataRef.data, context);
      } catch (err) {
        err.message += ` Path: ${dataRef.path}`;
        return callback(err);
      }

      callback(null, data);
    },

    [RESOURCE_SCHEMA]: {
      [CASE]: (dataRef, context, callback) => {
        const resource = dataRef.data;
        callback(null, resource.Type);
      },

      [DEFAULT]: options.anyResourceTypeParser || IGNORED,

      ...(options.resourceTypeParsers || {}),
    },
  };

  options.schemaMap !== undefined && Object.assign(schemaMap, options.schemaMap);

  return schemaMap;
}

/*
 * Exports.
 */
exports.makeSchemaMap = makeSchemaMap;
