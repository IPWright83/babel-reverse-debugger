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

/**
 * Calculate a suitable display value and the actual value
 */
function getValues(t, node) {
    // For more complex operators (e.g. +=) we need to evaluate the right hand side
    // too, otherwise we won't record the overall evaluated value
    if (node.operator !== '=') {
        const operator = node.operator.slice(0, -1); // Extract the operator (e.g., '+' from '+=')
        const value = t.binaryExpression(operator, node.left, node.right);
        return { value, displayValue: value };
    }

    // Handle binary expressions such as "3 + 7"
    const value = node.right;

    switch (value.type) {
        case "BinaryExpression": return { value, displayValue: value };     
        case "CallExpression": return { value, displayValue: t.stringLiteral("λ") };
        case "Identifier": return { value, displayValue: value }
        default: return { value, displayValue: getDisplayValue(t, value) } 
    }
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

    // Grab the value and display value
    const name = node.left?.name ?? node.left?.property.name;
    const { value, displayValue } = getValues(t, node);

    const captureAssignment = t.callExpression(t.identifier("___captureAssignment"), [
        t.stringLiteral(ASTType),
        t.stringLiteral(name),
        t.numericLiteral(lineNumber),
        displayValue,
        value
    ])

    path.replaceWith(
        t.expressionStatement(
            t.assignmentExpression(node.operator, node.left, captureAssignment)
        )
    );

    // Mark this node as processed to avoid re-processing
    path.node.__processed = true;
}

module.exports = {
    skip: utils.skip,
    inject,
}
