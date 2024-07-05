const AssignmentExpression = require("./AssignmentExpression");
const VariableDeclaration = require("./VariableDeclaration");
const Functions = require("./Functions");
const UpdateExpression = require("./UpdateExpression");
const ReturnStatement = require("./ReturnStatement");

module.exports = {
    AssignmentExpression: AssignmentExpression.inject,
    VariableDeclaration: VariableDeclaration.inject,
    FunctionDeclaration: Functions.inject,
    FunctionExpression: Functions.inject,
    ArrowFunctionExpression: Functions.inject,
    ClassMethod: Functions.inject,
    UpdateExpression: UpdateExpression.inject,
    ReturnStatement: ReturnStatement.inject,
}
