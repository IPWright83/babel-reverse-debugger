const utils = require("./utils");
const isDebug = require("./isDebug");

function getObjectExpression(t, objExpression) {
    const properties = objExpression.properties.map(prop => {
        if (prop.value.type === "ObjectExpression") {
            // If the property value is an object expression, recursively handle it
            return t.objectProperty(
                prop.key,
                getObjectExpression(t, prop.value)
            );
        } else {
            return t.objectProperty(
                prop.key,
                getDisplayValue(t, { init: prop.value })
            );
        }
    });
    return t.objectExpression(properties);
}

function getDisplayValue(t, declaration) {
    if (!declaration.init) {
        return t.identifier("undefined");
    }

    switch (declaration.init.type) {
        case "NumericLiteral":
            return t.numericLiteral(declaration.init.value);
        case "StringLiteral":
            return t.stringLiteral(declaration.init.value);
        case "BooleanLiteral":
            return t.booleanLiteral(declaration.init.value);
        case "ObjectExpression":
            return getObjectExpression(t, declaration.init);
        default: {
            return t.stringLiteral("λ");
        }
    }
}

/**
  * Injects the recording of a value return from a function
  */
function inject({ t, path, ASTType }) {
    if (utils.skip(path)) { return }

    isDebug && console.debug("variables.inject");

    const { node } = path;
    const { declarations = [], init } = node; 
    const lineNumber = utils.getLineNumber(path);

    declarations.forEach(declaration => {
        const name = declaration.id?.name;
        const displayValue = getDisplayValue(t, declaration);
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
    skip: utils.skip,
    inject,
}
