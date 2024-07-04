/**
  * Attempt to extract the name in a safe way that doesn't use null coalescing
  * as this isn't supported by https://astexplorer.net/
  */
function extractName(path) {
  const { node, parent } = path;

  return node.id?.name ??
    node.key?.name ??
    parent?.id?.name ??
    parent?.key?.name;
}

function getLineNumber(path) {
  return path.node.loc?.start?.line ?? path.parent.loc?.start?.line;
}

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

module.exports = {
  extractName, 
  getLineNumber,
  skip,
}
