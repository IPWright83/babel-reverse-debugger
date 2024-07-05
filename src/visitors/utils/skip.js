const getLineNumber = require("./getLineNumber");

/**
 * Determines if we should skip processing the current AST node
 * @param  {} path       The path to the current node
 * @return {Boolean}     True if we should skip the node
 */
function skip(path) { 
  const lineNumber = getLineNumber(path);
  if (lineNumber === undefined) {
    return true;
  }

  // Skip nodes that have already been processed
  if (path.node.__processed) {
    return true;
  }

  return false;
}

module.exports = skip;
