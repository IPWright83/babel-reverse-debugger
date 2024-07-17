const { identifier, variableDeclaration } = require("@babel/types");
const visitors = require("./visitors");
const fs = require("fs");
const path = require('path');
const { isDebug } = require("./visitors/utils");

const visit = (t, ASTType) => (path) => {
  // Find an appropriate visitor
  const visitor = visitors[ASTType];
  if (!visitor) {
    return;
  }

  // Determine if we should skip the path
  const name = visitor.getName(path);
  if (visitor.skip(name, path)) {
    path.skip();
    isDebug && console.log("\x1b[32m%s\x1b[0m", `Skipping: ${name} (${ASTType})`);
    return;
  }

  visitor.inject({ t, path, ASTType });
}

module.exports = function (babel) {
  const { types: t, parse } = babel;
  const instrumentationPath = path.join(__dirname, 'blank.js');
  const code = fs.readFileSync(instrumentationPath, "utf8");
  
  return {
    visitor: {
      Program(path, state, a, b, c) {
        // Don't inject our functions in tests
        if (process.env && process.env.NODE_ENV === 'test') {
          return;
        }

        // We need to parse our code into an AST and then insert it
        // into the body of the program so we can call out to the various
        // functions later on
        path.unshiftContainer("body", parse(code).program.body);
      },
      Identifier(path) {
        if (path.node.name?.startsWith("_")) {
          path.skip();
          return;
        }
      },
      FunctionDeclaration: visit(t, "FunctionDeclaration"),
      FunctionExpression: visit(t, "FunctionExpression"),
      ArrowFunctionExpression: visit(t, "ArrowFunctionExpression"),
      ClassMethod: visit(t, "ClassMethod"),
      ReturnStatement: visit(t, "ReturnStatement"),
      VariableDeclaration: visit(t, "VariableDeclaration"),
      AssignmentExpression: visit(t, "AssignmentExpression"),
      UpdateExpression: visit(t, "UpdateExpression"),
    }
  };
}
