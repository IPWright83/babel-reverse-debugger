const utils = require("./utils");

/**
 * Should we skip this particular AST node?
 */
function skip(name, path) {
    // Our internal functions
    if (name && name.startsWith("___")) {
        path.skip();
        return true;
    };

    if (path.node.__processed) {
        return true;
    }

    // Code that we don't have any line numbers for
    if (path.node.loc == undefined || path.node.loc.start === undefined || path.node.loc.start.line === undefined) {
        return true;
    }

    return false;
}

/**
  * Attempt to extract the name in a safe way that doesn't use null coalescing
  * as this isn't supported by https://astexplorer.net/
  */
function getName(path) {
    const { node, parent } = path;
    const name = utils.getName(path);
    if (name) {
        return name;
    }

    // Attempt to handle arrow functions inside a class
    //    class scientificCalculator {
    //       cos = (degrees) => Math.cos(degress * (Math.PI / 180))
    //    }
    if (["ArrowFunctionExpression", "FunctionExpression"].includes(node.type)) {
        const isInDefineProperty = parent.type === "CallExpression" && parent.callee?.name === "_defineProperty";
        const isInCaptureAssignment = parent.type === "CallExpression" && parent.callee?.name === "_captureAssignment";

        // Force this function to be skipped as we end up with duplicate instrumentation calls
        // so we'll just use the ArrowFunctionExpression instead
        if (node.type === "FunctionExpression" && (isInDefineProperty)) {
            return "_";
        }

        if (node.type === "ArrowFunctionExpression" && (isInDefineProperty || isInCaptureAssignment)) {
            return parent.arguments?.[1]?.value;
        }
    }
}

/**
 * Injects a call to capture a function calls arguments
 */
function inject({ t, path, ASTType }) {
    utils.isDebug && console.debug("functions.inject");

    const name = getName(path);
    const lineNumber = utils.getLineNumber(path);
    const parameters = path.node.params.map(p =>
        t.objectProperty(t.identifier(p.name), t.identifier(p.name))
    );

    const captureStart = t.expressionStatement(
        t.callExpression(t.identifier("_instrumentFunction"), [
            t.stringLiteral(ASTType),
            t.stringLiteral(name || "anonymous"), // Use extracted name or default to "anonymous"
            t.numericLiteral(lineNumber),
            t.objectExpression(parameters)
        ])
    );

    if (t.isBlockStatement(path.node.body)) {
        path.get("body").unshiftContainer("body", captureStart);
    } else {
        const body = t.blockStatement([captureStart, t.returnStatement(path.node.body)]);
        path.get('body').replaceWith(body);
    }

    // Mark this node as processed to avoid re-processing
    path.node.__processed = true;
}

module.exports = {
    skip,
    getName,
    inject,
}
