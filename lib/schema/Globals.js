const {
  ALLOWED_VALUES,
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

    CacheClusterEnabled: {
      [TYPE]: Boolean,
      [REQUIRED]: false,
    },

    CacheClusterSize: {
      [TYPE]: String,
      [REQUIRED]: false,
    },

    Variables: {
      [REQUIRED]: false,

      [ANY]: IGNORED,
    },

    MethodSettings: {
      [REQUIRED]: false,
    },

    EndpointConfiguration: {
      [TYPE]: String,
      [REQUIRED]: false,
      [ALLOWED_VALUES]: [
        'EDGE',
        'REGIONAL',
      ],
    },

    BinaryMediaTypes: {
      [TYPE]: Array,
      [REQUIRED]: false,
      [ELEMENT]: {
        [TYPE]: String,
      },
    },

    Cors: {
      [CASE]: TYPE_OF_DATA,
      [REQUIRED]: false,

      string: {},

      object: {
        AllowMethods: {
          [REQUIRED]: false,
        },

        AllowHeaders: {
          [REQUIRED]: false,
        },

        AllowOrigin: {
          [REQUIRED]: true,
        },

        MaxAge: {
          [REQUIRED]: false,
        },
      },

      [DEFAULT]: TYPE_MISMATCH,
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
