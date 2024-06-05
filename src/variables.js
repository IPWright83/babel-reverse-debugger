const utils = require("./utils");

/**
  * Should we skip this particular AST node?
  */
function skip(path) { 
    const lineNumber = utils.getLineNumber(path);
    if (lineNumber === undefined) {
        return true;
    }

    return false;
}

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
                getValue(t, { init: prop.value })
            );
        }
    });
    return t.objectExpression(properties);
}

function getValue(t, declaration) {
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
            debugger;
            return getObjectExpression(t, declaration.init);
        default: {
            debugger;
            return t.stringLiteral("λ");
        }
    }
}

/**
  * Injects the recording of a value return from a function
  */
function inject({ t, path, ASTType }) {
    if (skip(path)) { return }

    const { node } = path;
    const { declarations = [], init } = node; 
    const lineNumber = utils.getLineNumber(path);

    // Collect top-level statements
    let topLevelStatements = [];

    declarations.forEach(declaration => {
        const name = declaration.id?.name;
        const value = getValue(t, declaration);

        // console.log(ASTType, name, lineNumber, value);
        const captureAssignment = t.expressionStatement(
            t.callExpression(t.identifier("___captureAssignment"), [
                t.stringLiteral(ASTType),
                t.stringLiteral(name),
                t.numericLiteral(lineNumber),
                value
            ])
        );

        path.insertAfter(captureAssignment);
    })
}

module.exports = {
    skip,
    inject,
}
