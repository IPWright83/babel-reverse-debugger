const utils = require("./utils");

/**
  * Injects the recording of a value return from a function
  */
function inject({ t, path, ASTType }) {
    if (utils.skip(path)) { 
        console.log("skipping");
        return 
    }
    console.log("not skipped");



    utils.isDebug && console.debug("variables.inject");

    const { node } = path;
    const { declarations = [], init } = node; 
    const lineNumber = utils.getLineNumber(path);

    // Extract the name of the declarations, and
    // carry out an additional skip if they all start
    // with underscores
    if (declarations.every(d => (d.id?.name ?? "").startsWith("___"))) {
        return;
    }

    declarations.forEach(declaration => {
        const name = declaration.id?.name;
        const displayValue = utils.getDisplayValue(t, declaration.init);
        const value = declaration.init ?? t.identifier("undefined");

        const captureAssignmentCall = t.callExpression(t.identifier("___captureAssignment"), [
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
    inject,
}
