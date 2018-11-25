const {
  ANY,
  IGNORED,
  UNKNOWN_ERROR,
} = require('declarative-traverser');
const { Metadata } = require('./Metadata');
const { Transform } = require('./Transform');
const { Parameters } = require('./Parameters');
const { Mappings } = require('./Mappings');
const { Conditions } = require('./Conditions');
const { Globals } = require('./Globals');
const { Resources } = require('./Resources');
const { Outputs } = require('./Outputs');
const { makeSchemaMap } = require('./makeSchemaMap');

const schema = {
  AWSTemplateFormatVersion: '2010-09-09',

  Description: IGNORED,

  Metadata,
  Transform,
  Parameters,
  Mappings,
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
