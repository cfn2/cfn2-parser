const {
  ANY,
  BEGIN,
  DEBUG,
  DEFAULT,
  ELEMENT,
  END,
  IGNORED,
  PROHIBITED,
  REQUIRED,
  RETURN_DATA,
  SHORTHAND_ENABLED,
  TYPE,
} = require('declarative-traverser');
const {
  APPLY_FUNCTION,
  RESOURCE_SCHEMA,
} = require('../symbols');
const {
  ERR_CFN_CYCLIC_REFERENCE,
  ERR_CFN_DEPENDENT_RESOURCE_NOT_FOUND,
} = require('../errors');
const {
  getFunctionName,
} = require('../intrinsic-functions');

const Resources = {
  [TYPE]: Object,

  [BEGIN]: [
    cloneAndNormalizeResources,
    transformServerlessResources,
    sortResources,
  ],

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
};

function cloneAndNormalizeResources(dataRef, context, callback) {
  const resources = Object.entries(dataRef.data)
    .reduce((resources, [LogicalId, resource]) => {
      /*
       * Clone and normalize.
       */
      resource = {
        LogicalId,
        ...resource,
      };

      if (resource.Properties === undefined) {
        resource.Properties = {};
      }

      /*
       * Get properties and attributes from context.
       */
      const contextResource = context.Resources[LogicalId];

      if (contextResource) {
        resource.Attributes = contextResource.Attributes;
        Object.assign(resource.Properties, contextResource.Properties);
      }

      /*
       * Set dependent resources.
       */
      resource = setDependentResources(resource, context);

      /*
       * Put into new resources.
       */
      resources[LogicalId] = resource;

      return resources;
    }, {});

  callback(null, resources);
}

function transformServerlessResources(dataRef, context, callback) {
  const resources = dataRef.data;

  const events = findEventsForImplicitApi(Object.values(resources));

  if (!events.length) {
    return callback(null);
  }

  const implicitApi = dataRef.data['ServerlessRestApi'] || {
    LogicalId: 'ServerlessRestApi',
    Type: 'AWS::Serverless::Api',
    Properties: {
      StageName: 'Prod',
      ...context.Globals.Api,
    },
    DependentResources: [],
  };

  const {
    DefinitionBody = implicitApi.Properties.DefinitionBody = {
      swagger: 2,
      paths: {},
    },
  } = implicitApi.Properties;

  /*
   * Make ServerlessRestApi from found events.
   */
  events.forEach(({ logicalId, event }) => {
    const {
      Path,
      Method,
    } = event.Properties;

    const {
      [Path]: pathItem = DefinitionBody.paths[Path] = {},
    } = DefinitionBody.paths;

    let methodInSwagger = Method.toLowerCase();

    if (methodInSwagger === 'any') {
      methodInSwagger = 'x-amazon-apigateway-any-method';
    }

    pathItem[Method] = {
      'x-amazon-apigateway-integration': {
        type: 'aws_proxy',
        httpMethod: 'POST',
        uri: {
          'Fn::Sub': [
            'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:${functionName}/invocations',
            {
              functionName: {
                Ref: logicalId,
              },
            },
          ],
        },
      },
    };

    if (!implicitApi.DependentResources.includes(logicalId)) {
      implicitApi.DependentResources.push(logicalId);
    }
  });

  resources['ServerlessRestApi'] = implicitApi;

  /*
   * Remove all events from Function resources.
   */
  Object.values(resources).forEach(resource => {
    if (resource.Type === 'AWS::Serverless::Function' &&
      typeof resource.Properties === 'object') {
      delete resource.Properties.Events;
    }
  });

  callback(null, resources);
}

function findEventsForImplicitApi(resources) {
  return resources.reduce((events, resource) => {
    if (resource.Type === 'AWS::Serverless::Function' &&
      typeof resource.Properties === 'object' &&
      typeof resource.Properties.Events === 'object'
    ) {
      Object.values(resource.Properties.Events).forEach(event => {
        if (typeof event === 'object' &&
          event.Type === 'Api' &&
          typeof event.Properties === 'object' &&
          event.Properties.RestApiId === undefined
        ) {
          events.push({
            logicalId: resource.LogicalId,
            event,
          });
        }
      });
    }

    return events;
  }, []);
}

function setDependentResources(resource, context) {
  const deps = [];

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

  /*
   * Transform for Serverless resources.
   */
  deps.forEach((name, index, deps) => {
    deps[index] = name.replace(/\..+/, '');
  });

  resource.DependentResources = [...(new Set(deps))];

  return resource;
}

/*
 * Topological sort for resources.
 */
function sortResources(dataRef, context, callback) {
  const resources = dataRef.data;

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

  callback(null, result);
}

/*
 * Exports.
 */
exports.Resources = Resources;
