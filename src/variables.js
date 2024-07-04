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
    isDebug && console.log(path.node);

    const { node } = path;
    const { declarations = [], init } = node; 
    const lineNumber = utils.getLineNumber(path);

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
    skip: utils.skip,
    inject,
}
