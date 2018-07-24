const {
  ANY,
  DEFAULT,
} = require('declarative-traverser');

const Conditions = {
  [DEFAULT]: {},

  [ANY]: (dataRef, context, callback) => {
    callback(null);
  },
};

/*
 * Exports.
 */
exports.Conditions = Conditions;
