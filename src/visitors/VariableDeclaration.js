const utils = require("./utils");

function getName(path) {
    const { node } = path;
    const { declarations = [] } = node; 

    return declarations.map(d => d.id?.name);
}

function skip(names, path) {
    if (names.every(name => name.startsWith("_"))) {
        return true;
    }

    const { node } = path;
    if (path.node.__processed) {
        return true;
    }

    return false;
}

/**
  * Injects the recording of a value return from a function
  */
function inject({ t, path, ASTType }) {
    utils.isDebug && console.debug("variables.inject");

    const { node } = path;
    const { declarations = [], init } = node; 
    const lineNumber = utils.getLineNumber(path);

    declarations.forEach(declaration => {
        const name = declaration.id?.name;
        const displayValue = utils.getDisplayValue(t, declaration.init);
        const value = declaration.init ?? t.identifier("undefined");

        const captureAssignmentCall = t.callExpression(t.identifier("_captureAssignment"), [
            t.stringLiteral(ASTType),
            t.stringLiteral(name),
            t.numericLiteral(lineNumber),
            displayValue,
            value,
        ]);

        declaration.init = captureAssignmentCall;
    })

    path.replaceWith(
        t.variableDeclaration(node.kind, declarations)
    );

    // Mark this node as processed to avoid re-processing
    path.node.__processed = true;
}

module.exports = {
    skip,
    getName,
    inject,
}
