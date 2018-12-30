const {
  ERR_CFN_AMBIGUOUS_REFERENCE,
  ERR_CFN_ARGUMENT_TYPE_MISMATCH,
  ERR_CFN_INDEX_OUT_OF_RANGE,
  ERR_CFN_MISSING_ARGUMENTS,
  ERR_CFN_NO_ATTRIBUTES,
  ERR_CFN_REFERENCE_ATTRIBUTE_NOT_FOUND,
  ERR_CFN_REFERENCE_RESOURCE_NOT_FOUND,
} = require('./errors');

const INTRINSIC_FUNCTIONS = {
  Ref: (arg, context) => {
    if (typeof arg !== 'string') {
      throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Ref');
    }

    return doRef(arg, context);
  },

  'Fn::Base64': (arg, context) => {
    arg = applyFunction(arg, context);

    if (typeof arg !== 'string') {
      throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Fn::Base64');
    }

    return Buffer.from(arg).toString('base64');
  },

  'Fn::FindInMap': (arg, context) => {
    if (!Array.isArray(arg)) {
      throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Fn::FindInMap');
    }

    if (arg.length < 3) {
      throw ERR_CFN_MISSING_ARGUMENTS('Fn::FindInMap');
    }

    const [mapName, topLevelKey, secondLevelKey] = arg.map(arg => applyFunction(arg, context));

    return context.Mappings[mapName][topLevelKey][secondLevelKey];
  },

  'Fn::GetAtt': doGetAtt,

  'Fn::Join': (arg, context) => {
    if (!Array.isArray(arg)) {
      throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Fn::Join');
    }

    const [delimiter, list] = arg;

    if (typeof delimiter !== 'string') {
      throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Fn::Join');
    }

    if (!Array.isArray(list)) {
      throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Fn::Join');
    }

    return applyFunction(list, context).join(delimiter);
  },

  'Fn::Select': (arg, context) => {
    if (!Array.isArray(arg)) {
      throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Fn::Select');
    }

    const [index, list] = arg;

    if (typeof index !== 'number') {
      throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Fn::Select');
    }

    if (!Array.isArray(list)) {
      throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Fn::Select');
    }

    list = applyFunction(list, context);

    if (index < 0 || index >= list.length) {
      throw ERR_CFN_INDEX_OUT_OF_RANGE(index);
    }

    return list[index];
  },

  'Fn::Sub': (arg, context) => {
    let variableMap;
    let str;

    if (typeof arg === 'string') {
      str = arg;
    } else if (Array.isArray(arg)) {
      [str, variableMap] = arg;

      if (typeof variableMap !== 'object') {
        throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Fn::Sub');
      }

      variableMap = applyFunction(variableMap, context);
    } else {
      throw ERR_CFN_ARGUMENT_TYPE_MISMATCH('Fn::Sub');
    }

    return str.replace(/\${([^}]+)}/g, (match, p1) => {
      if (p1.startsWith('!')) {
        return `\${${p1}}`;
      }

      /*
       * Get a resource attribute.
       */
      if (p1.includes('.')) {
        return doGetAtt(p1, context);
      }

      /*
       * Get a value from a variable map.
       */
      if (variableMap && variableMap.hasOwnProperty(p1)) {
        return variableMap[p1];
      }

      /*
       * Get a value of a resource or a parameter.
       */
      return doRef(p1, context);
    });
  }
};

function doRef(arg, context) {
  const { Parameters, Resources } = context;

  arg = arg.replace(/\..+/, '');

  if (Parameters.hasOwnProperty(arg)) {
    if (Resources.hasOwnProperty(arg)) {
      throw ERR_CFN_AMBIGUOUS_REFERENCE(arg);
    }

    return Parameters[arg].Value;
  } else {
    if (!Resources.hasOwnProperty(arg)) {
      throw ERR_CFN_REFERENCE_RESOURCE_NOT_FOUND(arg);
    }

    return Resources[arg].PhysicalId;
  }
}

function doGetAtt(arg, context) {
  if (typeof arg === 'string') {
    arg = arg.split('.');
  }

  const [logicalId, attributeName] = arg;
  const resource = context.Resources[logicalId];

  if (!resource) {
    throw ERR_CFN_REFERENCE_RESOURCE_NOT_FOUND(logicalId);
  }

  const { Attributes } = resource;

  if (!Attributes) {
    throw ERR_CFN_NO_ATTRIBUTES(logicalId);
  }

  const attribute = Attributes[attributeName];

  if (!attribute) {
    throw ERR_CFN_REFERENCE_ATTRIBUTE_NOT_FOUND(attributeName, logicalId);
  }

  return attribute;
}

function applyFunction(node, context) {
  if (Array.isArray(node)) {
    return node.map(e => applyFunction(e, context));
  }

  if (typeof node !== 'object') {
    return node;
  }

  const name = getFunctionName(node);
  if (name) {
    const fn = INTRINSIC_FUNCTIONS[name];
    if (fn) {
      return fn(node[name], context);
    }
  }

  return Object.entries(node)
    .reduce((obj, [key, value]) => (obj[key] = applyFunction(value, context), obj), {});
}

function getFunctionName(obj) {
  const keys = Object.keys(obj);

  if (keys.length !== 1) {
    return;
  }

  const [name] = keys;

  return INTRINSIC_FUNCTIONS.hasOwnProperty(name) ? name : undefined;
}

/*
 * Exports.
 */
exports.applyFunction = applyFunction;
exports.getFunctionName = getFunctionName;
