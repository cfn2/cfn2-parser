const {
  ANY,
  DEFAULT,
} = require('declarative-traverser');

const Mappings = {
  [DEFAULT]: {},

  [ANY]: (dataRef, context, callback) => {
    const contextMappings = context.Mappings;
    const mapName = dataRef.key;

    if (contextMappings[mapName] === undefined) {
      contextMappings[mapName] = dataRef.data;
    }

    callback(null);
  },
};

/*
 * Exports.
 */
exports.Mappings = Mappings;
