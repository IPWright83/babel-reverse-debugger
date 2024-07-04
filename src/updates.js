const isDebug = require("./isDebug");
const utils = require("./utils");

function inject({ t, path, ASTType }) {
    if (utils.skip(path)) { return }

    isDebug && console.debug("updates.inject");

    const { operator, argument, prefix } = path.node;
    const name = utils.extractName(path) ?? argument.name;
    const lineNumber = utils.getLineNumber(path);

    const displayValue = t.numericLiteral(1);
    const newValue = t.binaryExpression(
        operator === "++" ? "+" : "-",
        argument,
        displayValue
    );

    const captureAssignmentCall = t.callExpression(t.identifier("___captureAssignment"), [
        t.stringLiteral(ASTType),
        t.stringLiteral(name),
        t.numericLiteral(lineNumber),
        displayValue,
        newValue,
    ]);

    // Replace the original update expression with a compound assignment
    const newExpression = prefix
        ? t.assignmentExpression(operator === "++" ? "+=" : "-=", argument, captureAssignmentCall)
        : t.sequenceExpression([
            t.assignmentExpression(operator === "++" ? "+=" : "-=", argument, captureAssignmentCall),
            argument,
        ]);

    path.replaceWith(newExpression);
}

module.exports = {
    skip: utils.skip,
    inject,
}
