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

module.exports = {
  extractName, 
  getLineNumber,
}
