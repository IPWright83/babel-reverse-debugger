const AssignmentExpression = require("./AssignmentExpression");
const VariableDeclaration = require("./VariableDeclaration");
const Functions = require("./Functions");
const UpdateExpression = require("./UpdateExpression");
const ReturnStatement = require("./ReturnStatement");

module.exports = {
    AssignmentExpression: AssignmentExpression,
    VariableDeclaration: VariableDeclaration,
    FunctionDeclaration: Functions,
    FunctionExpression: Functions,
    Functions,
    ArrowFunctionExpression: Functions,
    ClassMethod: Functions,
    UpdateExpression: UpdateExpression,
    ReturnStatement: ReturnStatement,
}
