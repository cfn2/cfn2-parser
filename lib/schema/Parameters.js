const {
  ANY,
  BEGIN,
  DEFAULT,
  END,
} = require('declarative-traverser');

const {
  ERR_CFN_CONTEXT_MISSING_PARAMETERS,
  ERR_CFN_CONTEXT_PARAMETER_UNDEFINED,
  ERR_CFN_CONTEXT_PARAMETER_TYPE_MISMATCH,
} = require('../errors');

const Parameters = {
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
};

/*
 * Exports.
 */
exports.Parameters = Parameters;
