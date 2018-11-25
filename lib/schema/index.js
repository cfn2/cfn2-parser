const {
  ALLOWED_VALUES,
  ANY,
  CASE,
  DEFAULT,
  ELEMENT,
  IGNORED,
  REQUIRED,
  TYPE,
  TYPE_MISMATCH,
  TYPE_OF_DATA,
  UNKNOWN_ERROR,
} = require('declarative-traverser');
const { Parameters } = require('./Parameters');
const { Conditions } = require('./Conditions');
const { Globals } = require('./Globals');
const { Resources } = require('./Resources');
const { Outputs } = require('./Outputs');
const { makeSchemaMap } = require('./makeSchemaMap');

const schema = {
  AWSTemplateFormatVersion: '2010-09-09',

  Description: IGNORED,

  Metadata: {
    [DEFAULT]: {},
  },

  Transform: {
    [CASE]: TYPE_OF_DATA,
    [REQUIRED]: false,

    string: {
      [TYPE]: String,
    },

    object: {
      [TYPE]: Array,
      [ELEMENT]: {
        [TYPE]: String,
      },
    },

    [DEFAULT]: TYPE_MISMATCH,
  },

  Parameters,

  Mappings: {
    [DEFAULT]: {},

    [ANY]: (dataRef, context, callback) => {
      const contextMappings = context.Mappings;
      const mapName = dataRef.key;

      if (contextMappings[mapName] === undefined) {
        contextMappings[mapName] = dataRef.data;
      }

      callback(null);
    },
  },

  Conditions,

  Globals,

  Resources,

  Outputs,

  [ANY]: UNKNOWN_ERROR,
};

/*
 * Exports.
 */
exports.makeSchemaMap = makeSchemaMap;
exports.schema = schema;
