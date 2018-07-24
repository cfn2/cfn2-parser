const {
  ANY,
  BEGIN,
  DEFAULT,
  REQUIRED,
  TYPE,
} = require('declarative-traverser');
const {
  APPLY_FUNCTION,
} = require('../symbols');

const Outputs = {
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
};

/*
 * Exports.
 */
exports.Outputs = Outputs;
