const utils = require("./utils");

function getName(path) {
    const { node } = path;
    const name = node.left?.name ?? node.left?.property.name;
    return name;
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
        default: return { value, displayValue: utils.getDisplayValue(t, value) } 
    }
}

/**
  * Injects the recording of a value return from a function
  */
function inject({ t, path, ASTType }) {
    debugger;
    utils.isDebug && console.debug("assignments.inject");

    const { node } = path;
    const assignment = node.right;
    const lineNumber = utils.getLineNumber(path);

    // Grab the value and display value
    const name = getName(path);
    const { value, displayValue } = getValues(t, node);

    const captureAssignment = t.callExpression(t.identifier("_captureAssignment"), [
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
    inject,
    getName,
    skip: utils.skip,
}
