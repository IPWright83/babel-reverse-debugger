const utils = require("./utils");

/**
  * Attempt to extract the name in a safe way that doesn't use null coalescing
  * as this isn't supported by https://astexplorer.net/
  */
function extractName(path) {
    const { node, parent } = path;

    const name = utils.extractName(path);
    if (name) {
        return name;
    }

    // Attempt to handle arrow functions inside a class
    //    class scientificCalculator {
    //       cos = (degrees) => Math.cos(degress * (Math.PI / 180))
    //    }
    if (!name && ["ArrowFunctionExpression", "FunctionExpression"].includes(node.type)) {
        const isInDefineProperty = parent.type === "CallExpression" && parent.callee?.name === "_defineProperty";

        // Force this function to be skipped as we end up with duplicate instrumentation calls
        // so we'll just use the ArrowFunctionExpression instead
        if (node.type === "FunctionExpression" && isInDefineProperty) {
            return "___";
        }

        if (node.type === "ArrowFunctionExpression" && isInDefineProperty) {
            return parent.arguments?.[1]?.value;
        }
    }
}

/**
 * Injects a call to capture a function calls arguments
 */
function inject({ t, path, ASTType }) {
    const name = extractName(path);
    if (skip(name, path)) {
        return;
    }

    const lineNumber = utils.getLineNumber(path);
    const parameters = path.node.params.map((p) =>
        t.objectProperty(t.identifier(p.name), t.identifier(p.name))
    );

    const captureStart = t.expressionStatement(
        t.callExpression(t.identifier("___instrumentFunction"), [
            t.stringLiteral(ASTType),
            t.stringLiteral(name ?? "anonymous"),
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
}

/**
 * Should we skip this particular AST node?
 */
function skip(name, path) {
    // Our internal functions
    if (name && name.startsWith("___")) return true;

    // Code that we don't have any line numbers for
    if (path.node.loc == undefined || path.node.loc.start === undefined || path.node.loc.start.line === undefined) {
        return true;
    }

    return false;
}

module.exports = {
    skip,
    inject,
}
