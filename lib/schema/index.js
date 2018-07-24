const {
  ALLOWED_VALUES,
  ANY,
  DEFAULT,
  IGNORED,
  REQUIRED,
  TYPE,
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
    [TYPE]: String,
    [ALLOWED_VALUES]: 'AWS::Serverless-2016-10-31',
    [REQUIRED]: false,
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
