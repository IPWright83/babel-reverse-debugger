const isDebug = require("./isDebug");
const utils = require("./utils");

function inject({ t, path, ASTType }) {
    if (utils.skip(path)) { return }

    isDebug && console.debug("updates.inject");

    const { operator, argument, prefix } = path.node;
    const name = utils.extractName(path) ?? argument.name;
    const lineNumber = utils.getLineNumber(path);

    const value = t.numericLiteral(1);
    const displayValue = operator === "=" ? argument : t.binaryExpression(
        operator === "++" ? "+" : "-",
        argument,
        value
    );

    const captureAssignmentCall = t.callExpression(t.identifier("___captureAssignment"), [
        t.stringLiteral(ASTType),
        t.stringLiteral(name),
        t.numericLiteral(lineNumber),
        displayValue,
        value,
    ]);

    // Replace the original update expression with a compound assignment
    let newExpression = null;
    switch (operator) {
        case "++": newExpression = t.assignmentExpression("+=", argument, captureAssignmentCall); break;
        case "--": newExpression = t.assignmentExpression("-=", argument, captureAssignmentCall); break;
        case "=": newExpression = t.assignmentExpression("=", argument, captureAssignmentCall); break;
    }

    path.replaceWith(newExpression);

    // Mark this node as processed to avoid re-processing
    path.node.__processed = true;
}

module.exports = {
    skip: utils.skip,
    inject,
}
