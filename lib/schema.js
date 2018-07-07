const {
  ALLOWED_VALUES,
  ANY,
  BEGIN,
  CASE,
  CLONE,
  DEBUG,
  DEFAULT,
  ELEMENT,
  END,
  IGNORED,
  PROHIBITED,
  REQUIRED,
  RETURN_DATA,
  SHORTHAND_ENABLED,
  TRAVERSER,
  TYPE,
  TYPE_MISMATCH,
  TYPE_OF_DATA,
  UNKNOWN_ERROR,
  logError,
  makeTraverser,
  noopTraverser,
} = require('declarative-traverser');
const { applyFunction } = require('./intrinsic-functions');
const {
  ERR_CFN_CONTEXT_MISSING_PARAMETERS,
  ERR_CFN_CONTEXT_PARAMETER_UNDEFINED,
  ERR_CFN_CONTEXT_PARAMETER_TYPE_MISMATCH,
  ERR_CFN_CYCLIC_REFERENCE,
  ERR_CFN_DEPENDENT_RESOURCE_NOT_FOUND,
} = require('./errors');
const {
  APPLY_FUNCTION,
  RESOURCE_SCHEMA,
} = require('./symbols');
const { getFunctionName } = require('./intrinsic-functions');

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

  Parameters: {
    [DEFAULT]: {},

    [BEGIN]: (dataRef, context, callback) => {
      const parameters = dataRef.data;

      /*
       * Check parameters of context.
       */
      Object.entries(context.Parameters).forEach(([key, value]) => {
        if (!key.startsWith('AWS::') && !parameters.hasOwnProperty(key)) {
          return callback(ERR_CFN_CONTEXT_PARAMETER_UNDEFINED(key));
        }

        if (value === undefined) {
          return;
        }

        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return callback(ERR_CFN_CONTEXT_PARAMETER_TYPE_MISMATCH(key));
        }
      });

      callback(null);
    },

    [ANY]: (dataRef, context, callback) => {
      const { key, data } = dataRef;

      /*
       * Merge to context.Parameters.
       */
      const parameter = context.Parameters[key] = {
        ...data,
        ...(context.Parameters[key] || {}),
      };

      /*
       * Apply Default.
       */
      if (parameter.Value === undefined) {
        parameter.Value = parameter.Default;
      }

      callback(null);
    },

    [END]: (dataRef, context, callback) => {
      const missingParameters = Object.entries(context.Parameters)
        .reduce((names, [name, parameter]) => (
          (parameter.Value === undefined) && names.push(name),
          names
        ), []);

      if (missingParameters.length > 0) {
        return callback(ERR_CFN_CONTEXT_MISSING_PARAMETERS(missingParameters.join(', ')));
      }

      callback(null);
    },
  },

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

  Conditions: {
    [DEFAULT]: {},

    [ANY]: (dataRef, context, callback) => {
      callback(null);
    },
  },

  Globals: {
    [DEFAULT]: {},

    Function: {
      [DEFAULT]: {},

      [BEGIN]: CLONE,

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
  },

  Resources: {
    [TYPE]: Object,

    [BEGIN]: (dataRef, context, callback) => {
      const resources = Object.entries(dataRef.data)
        .reduce((resources, [key, resource]) => {
          resource = {
            LogicalId: key,
            ...resource,
          };

          if (resource.Properties === undefined) {
            resource.Properties = {};
          }

          const contextResource = context.Resources[key];

          if (contextResource) {
            resource.Attributes = contextResource.Attributes;
            Object.assign(resource.Properties, contextResource.Properties);
          }

          resource = setDependentResources(resource, context);

          resources[key] = resource;

          return resources;
        }, {});

      callback(null, sortResources(resources, context));
    },

    [ANY]: {
      [TYPE]: Object,

      [BEGIN]: [
        APPLY_FUNCTION,
        (dataRef, context, callback) => {
          const resource = dataRef.data;

          context.Resources[resource.LogicalId] = resource;

          callback(null);
        },
      ],

      Type: /^(AWS::\w+::\w+|Custom::\w+)$/,

      Properties: {
        [TYPE]: Object,
        [DEFAULT]: {},
      },

      DependsOn: {
        [TYPE]: Array,
        [REQUIRED]: false,
        [SHORTHAND_ENABLED]: true,
        [ELEMENT]: String,
      },

      [END]: [
        DEBUG,
        RESOURCE_SCHEMA,
      ],
    },
  },

  Outputs: {
    [DEFAULT]: {},

    [ANY]: {
      [TYPE]: Object,

      [BEGIN]: [
        APPLY_FUNCTION,
        (dataRef, context, callback) => {
          const output = dataRef.data;

          context.Outputs[dataRef.key] = output;

          callback(null);
        },
      ],

      Description: {
        [TYPE]: String,
        [REQUIRED]: false,
      },

      Value: {
        [TYPE]: ANY,
      },

      Export: {
        [REQUIRED]: false,

        Name: String,
      },
    },
  },

  [ANY]: UNKNOWN_ERROR,
};

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

function setDependentResources(resource, context) {
  const deps = resource.DependentResources = [];

  /*
   * Add explicit dependencies.
   */
  const { DependsOn } = resource;
  if (DependsOn !== undefined) {
    if (Array.isArray(DependsOn)) {
      deps.push(...DependsOn);
    } else {
      deps.push(DependsOn);
    }
  }

  /*
   * Add implicit dependencies.
   */
  visit(resource);

  function visit(node) {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (typeof node !== 'object') {
      return;
    }

    const functionName = getFunctionName(node);

    if (functionName === 'Ref') {
      const arg = node[functionName];

      if (typeof arg === 'string') {
        if (context.Parameters.hasOwnProperty(arg)) {
          /*
           * Ignore parameters.
           */
          return;
        }

        deps.push(arg);
        return;
      }
    } else if (functionName === 'Fn::GetAtt') {
      const arg = node[functionName];

      if (Array.isArray(arg)) {
        const [name] = arg;
        if (typeof name === 'string') {
          deps.push(name);
          return;
        }
      } else if (typeof arg === 'string') {
        const [name] = arg.split('.');
        deps.push(name);
        return;
      }
    } else if (functionName === 'Fn::Sub') {
      const arg = node[functionName];
    }

    Object.values(node).forEach(visit);
  }

  return resource;
}

/*
 * Topological sort for resources.
 */
function sortResources(resources, context) {
  // Permanent marked and sorted resources.
  const result = {};

  // Temporary marked resources.
  const marks = new Set();

  function isPermanentMarked(resource) {
    return result.hasOwnProperty(resource.LogicalId);
  }

  Object.values(resources).forEach(resource => {
    if (!isPermanentMarked(resource)) {
      marks.clear();
      visit(resource);
    }
  });

  function visit(resource) {
    if (isPermanentMarked(resource)) {
      return;
    }

    marks.add(resource);

    resource.DependentResources.forEach(logicalId => {
      const dependentResource = resources[logicalId];

      if (!dependentResource) {
        throw ERR_CFN_DEPENDENT_RESOURCE_NOT_FOUND(logicalId);
      }

      /*
       * Detect cyclic references.
       */
      if (marks.has(dependentResource)) {
        context.errors.push(ERR_CFN_CYCLIC_REFERENCE(resource.LogicalId,
          dependentResource.LogicalId));

        return;
      }

      visit(dependentResource);
    });

    result[resource.LogicalId] = resource;
  }

  return result;
}

/*
 * Exports.
 */
exports.makeSchemaMap = makeSchemaMap;
exports.schema = schema;
