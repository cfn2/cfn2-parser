let util;
let chalk;

function E(code, message) {
  exports[code] = (...args) => {
    util || (util = require('util'));
    chalk || (chalk = require('chalk'));

    args = args.map(arg => chalk.green(arg));

    const err = new Error(util.format(message, ...args));
    err.code = code;

    return err;
  };
}

E('ERR_CFN_CYCLIC_REFERENCE', 'Cyclic reference from %s to %s.');
E('ERR_CFN_AMBIGUOUS_REFERENCE', 'Ambiguous reference %s.');
E('ERR_CFN_ARGUMENT_TYPE_MISMATCH', 'Arguments type mismatch of function %s.');
E('ERR_CFN_DEPENDENT_RESOURCE_NOT_FOUND', 'Dependent resource %s not found.');
E('ERR_CFN_INDEX_OUT_OF_RANGE', 'Index %s out of range.');
E('ERR_CFN_MISSING_ARGUMENTS', 'Missing arguments of function %s.');
E('ERR_CFN_NO_ATTRIBUTES', 'No attributes of resource %s.');
E('ERR_CFN_PARSING_TEMPLATE_FAILED', 'Parsing template failed.');
E('ERR_CFN_REFERENCE_ATTRIBUTE_NOT_FOUND', 'Attribute %s of resource %s not found.');
E('ERR_CFN_REFERENCE_RESOURCE_NOT_FOUND', 'Reference resource %s not found.');

/*
 * Context errors.
 */
E('ERR_CFN_CONTEXT_MISSING_PARAMETERS', 'Missing parameters %s.');
E('ERR_CFN_CONTEXT_PARAMETER_UNDEFINED', 'Context parameter %s is undefined in a template.');
E('ERR_CFN_CONTEXT_PARAMETER_TYPE_MISMATCH', 'Context parameter %s must be an object.');
