const { identifier } = require("@babel/types");
const visitors = require("./visitors");
const fs = require("fs");
const path = require('path');

module.exports = function (babel) {
  const { types: t, parse } = babel;
  const instrumentationPath = path.join(__dirname, 'instrumentation.js');
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
        }
      },
      /**
       * Handle FunctionDeclarations such as:
       *     function add(a, b) {
       *         return a + b;
       *     }
       */
      Function(path) {
        if (path.node.id?.name?.startsWith("_")) {
          path.skip();
        }

        visitors.FunctionDeclaration({ t, path, ASTType: "FunctionDeclaration" });
      },
      /**
       * Handle ReturnStatements such as:
       *   return "Hello World!";
       */
      ReturnStatement(path) {
        if (path.node.name?.startsWith("_")) {
          path.skip();
        }
        visitors.ReturnStatement({ t, path, ASTType: "ReturnStatement" });
      },

      VariableDeclaration(path) {
        if (path.node.name?.startsWith("_")) {
          path.skip();
        }
        visitors.VariableDeclaration({ t, path, ASTType: "VariableDeclaration" });
      },
      AssignmentExpression(path) {
        if (path.node.name?.startsWith("_")) {
          path.skip();
        }

        visitors.AssignmentExpression({ t, path, ASTType: "AssignmentExpression" });
      },
      UpdateExpression(path) {
        if (path.node.name?.startsWith("_")) {
          path.skip();
        }

        visitors.UpdateExpression({ t, path, ASTType: "UpdateExpression" });
      }
    }
  };
}
