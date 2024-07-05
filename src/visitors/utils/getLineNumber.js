/**
 * Obtain the current line number for the node
 * @param  {} path       The path to the current node
 * @return {number}      The line number
 */
function getLineNumber(path) {
  return path.node.loc?.start?.line ?? path.parent.loc?.start?.line;
}

module.exports = getLineNumber;
