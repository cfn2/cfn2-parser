const {
  CASE,
  DEFAULT,
  ELEMENT,
  REQUIRED,
  TYPE,
  TYPE_MISMATCH,
  TYPE_OF_DATA,
} = require('declarative-traverser');

const Transform = {
  [CASE]: TYPE_OF_DATA,
  [REQUIRED]: false,

  string: {
    [TYPE]: String,
  },

  object: {
    [TYPE]: Array,
    [ELEMENT]: {
      [TYPE]: String,
    },
  },

  [DEFAULT]: TYPE_MISMATCH,
};

/*
 * Exports.
 */
exports.Transform = Transform;
