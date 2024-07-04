const isDebug = require("./isDebug");
const utils = require("./utils");

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

function getValue(t, assignment) {
    if (!assignment.value) {
        return t.identifier("undefined");
    }

    switch (assignment.type) {
        case "NumericLiteral":
            return t.numericLiteral(assignment.value);
        case "StringLiteral":
            return t.stringLiteral(assignment.value);
        case "BooleanLiteral":
            return t.booleanLiteral(assignment.value);
        case "ObjectExpression":
            return getObjectExpression(t, assignment);
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

    isDebug && console.debug("assignments.inject");

    const { node } = path;
    const lineNumber = utils.getLineNumber(path);

    // Handle variable declarations
    const name = node.left?.name ?? node.left?.property.name;
    const value = getValue(t, node.right);

    console.log({ name, value });
    debugger;
    const captureAssignment = t.expressionStatement(
        t.callExpression(t.identifier("___captureAssignment"), [
            t.stringLiteral(ASTType),
            t.stringLiteral(name),
            t.numericLiteral(lineNumber),
            value
        ])
    );

    path.insertAfter(captureAssignment);
}

module.exports = {
    skip: utils.skip,
    inject,
}
