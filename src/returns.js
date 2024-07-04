const utils = require("./utils");
const isDebug = require("./isDebug");

/**
  * Should we skip this particular AST node?
  */
function skip(name, path) {
    const { parent } = path;
    const { callee } = parent;

    // This prevents a double instrument occuring when an arrow function
    // is assigned onto a class
    //    class scientificCalculator {
    //       cos = (degrees) => Math.cos(degress * (Math.PI / 180))
    //    }
    if (callee?.name === "_defineProperty") {
        return true;
    }

    if (path.parentPath.container?.id?.name === "___instrumentReturn") {
        return true;
    }

    return false;
}

/**
  * Injects the recording of a value return from a function
  */
function inject({ t, path, ASTType }) {
    const name = utils.extractName(path);
    if (skip(name, path)) { return }

    isDebug && console.debug("returns.inject");

    const { node } = path;
    const { argument } = node;

    const lineNumber = argument?.loc?.start?.line;
    if (lineNumber === undefined || name && name.startsWith("___")) {
        return;
    }

    // Check if the argument is a call expression to ___instrumentReturn
    // This prevents infinite recursion
    if (t.isCallExpression(argument) && t.isIdentifier(argument.callee) && argument.callee.name === "___instrumentReturn") {
        return true;
    }

    const captureReturn = t.callExpression(t.identifier("___instrumentReturn"), [t.stringLiteral(ASTType), t.numericLiteral(lineNumber), argument]);
    path.node.argument = captureReturn;

    // Mark this node as processed to avoid re-processing
    path.node.__processed = true;
}

module.exports = {
    skip,
    inject,
}
