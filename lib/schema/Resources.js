const {
  ANY,
  BEGIN,
  CASE,
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
  TYPE_MISMATCH,
  TYPE_OF_DATA,
  UNKNOWN_ERROR,
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

  [BEGIN]: (dataRef, context, callback) => {
    const resources = Object.entries(dataRef.data)
      .reduce((resources, [key, resource]) => {
        /*
         * Clone and normalize.
         */
        resource = {
          LogicalId: key,
          ...resource,
        };

        if (resource.Properties === undefined) {
          resource.Properties = {};
        }

        /*
         * Get properties and attributes from context.
         */
        const contextResource = context.Resources[key];

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
};

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
exports.Resources = Resources;
