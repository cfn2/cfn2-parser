const {
  ANY,
  BEGIN,
  CASE,
  CLONE,
  DEFAULT,
  ELEMENT,
  END,
  IGNORED,
  PROHIBITED,
  REQUIRED,
  RETURN_DATA,
  TYPE,
  TYPE_MISMATCH,
  TYPE_OF_DATA,
  UNKNOWN_ERROR,
} = require('declarative-traverser');
const {
  APPLY_FUNCTION,
} = require('../symbols');

const Globals = {
  [DEFAULT]: {},

  Function: {
    [DEFAULT]: {},

    [BEGIN]: APPLY_FUNCTION,

    Handler: {
      [TYPE]: String,
      [REQUIRED]: false,
    },

    Runtime: {
      [TYPE]: String,
      [REQUIRED]: false,
    },

    CodeUri: {
      [CASE]: TYPE_OF_DATA,
      [REQUIRED]: false,

      string: {
        [TYPE]: String,
      },

      object: {
        Bucket: {
          [TYPE]: String,
        },
        Key: {
          [TYPE]: String,
        },
        Version: {
          [TYPE]: String,
          [REQUIRED]: false,
        },
      },

      [DEFAULT]: TYPE_MISMATCH,
    },

    Environment: {
      [REQUIRED]: false,
      [BEGIN]: CLONE,

      Variables: {
        [TYPE]: Object,
        [BEGIN]: CLONE,
        [ANY]: APPLY_FUNCTION,
        [END]: RETURN_DATA,
      },

      [ANY]: UNKNOWN_ERROR,

      [END]: RETURN_DATA,
    },

    Description: IGNORED,
    MemorySize: IGNORED,
    Timeout: IGNORED,
    VpcConfig: {
      [REQUIRED]: false,
      SecurityGroupOds: IGNORED,
      SubnetIds: IGNORED,
    },
    Tags: IGNORED,
    Tracing: IGNORED,
    KmsKeyArn: IGNORED,
    DeadLetterQueue: IGNORED,
    DeploymentPreference: IGNORED,
    AutoPublishAlias: IGNORED,
    ReservedConcurrentExecutions: IGNORED,

    Role: PROHIBITED,
    Policies: PROHIBITED,
    FunctionName: PROHIBITED,
    Events: PROHIBITED,

    [ANY]: UNKNOWN_ERROR,

    [END]: (dataRef, context, callback) => {
      context.Globals.Function = dataRef.data;

      callback(null);
    },
  },

  Api: {
    [DEFAULT]: {},

    [BEGIN]: APPLY_FUNCTION,

    Name: {
      [TYPE]: String,
      [REQUIRED]: false,
    },

    StageName: PROHIBITED,

    DefinitionUri: IGNORED,

    DefinitionBody: PROHIBITED,

    CacheClusterEnabled: IGNORED,

    CacheClusterSize: IGNORED,

    Variables: {
      [REQUIRED]: false,

      [ANY]: IGNORED,
    },

    MethodSettings: IGNORED,

    EndpointConfiguration: IGNORED,

    BinaryMediaTypes: {
      [TYPE]: Array,
      [REQUIRED]: false,
      [ELEMENT]: {
        [TYPE]: String,
      },
    },

    Cors: {
      [REQUIRED]: false,
    },

    [ANY]: UNKNOWN_ERROR,

    [END]: (dataRef, context, callback) => {
      context.Globals.Api = dataRef.data;

      callback(null);
    },
  },

  [ANY]: UNKNOWN_ERROR,
};

/*
 * Exports.
 */
exports.Globals = Globals;
