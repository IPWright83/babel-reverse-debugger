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
                getDisplayValue(t, { init: prop.value })
            );
        }
    });
    return t.objectExpression(properties);
}

function getDisplayValue(t, assignment) {
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
    const assignment = node.right;
    const lineNumber = utils.getLineNumber(path);

    // Handle variable declarations
    const name = node.left?.name ?? node.left?.property.name;
    const displayValue = getDisplayValue(t, assignment);
    const value = assignment ?? t.identifier("undefined")

    const captureAssignment = t.expressionStatement(
        t.callExpression(t.identifier("___captureAssignment"), [
            t.stringLiteral(ASTType),
            t.stringLiteral(name),
            t.numericLiteral(lineNumber),
            displayValue,
            value
        ])
    );

    node.right = captureAssignment;

    // Mark this node as processed to avoid re-processing
    path.node.__processed = true;
}

module.exports = {
    skip: utils.skip,
    inject,
}
