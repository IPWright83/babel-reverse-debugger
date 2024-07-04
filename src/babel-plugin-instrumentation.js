const { extractName, getLineNumber } = require("./utils");
const injectors = require("./injectors");

module.exports = function (babel) {
  const { types: t, parse } = babel;

  const code = `
function ___instrumentFunction(type, name, lineNumber, args) { 
   console.log("\x1b[32m%s\x1b[0m", lineNumber + ": Function Call " + name + "(" + JSON.stringify(args) + ")");
}

function ___instrumentReturn(type, lineNumber, value) {
  console.log("\x1b[34m%s\x1b[0m", lineNumber + ": Returning " + value);
  return value;
}

function ___captureAssignment(type, name, lineNumber, displayValue, value) {
    console.log("\x1b[33m%s\x1b[0m", lineNumber + ": Assignment " + name + " = " + JSON.stringify(displayValue));
    return value;
}
`;

  return {
    visitor: {
      Program(path) {
        // Don't inject our functions in tests
        if (process.env && process.env.NODE_ENV === 'test') {
          return;
        }

        // We need to parse our code into an AST and then insert it
        // into the body of the program so we can call out to the various
        // functions later on
        path.unshiftContainer("body", parse(code).program.body);
      },
      /**
       * Handle FunctionDeclarations such as:
       *     function add(a, b) {
       *         return a + b;
       *     }
       */
      FunctionDeclaration(path) {
        injectors.functions.inject({ t, path, ASTType: "FunctionDeclaration" });
      },
      /**
       * Handle FunctionExpressions such as:
       *     const calculator = {
       *        sum: function(a, b) {
       *           return a + b;
       *        }
       *     } 
       */
      FunctionExpression(path) {
        injectors.functions.inject({ t, path, ASTType: "FunctionExpression" });
      },
      /**
       * Handle ArrowFunctionExpressions such as:
       *     const calculator = {
       *        sum: (a, b) => a + b;
       *     } 
       *
       *     const sum = (a, b) => a + b;
       */
      ArrowFunctionExpression(path) {
        injectors.functions.inject({ t, path, ASTType: "ArrowFunctionExpression" });
      },
      /**
       * Handle ClassMethods such as:
       *    class ScientificCalculator {
       *        constructor() {}            // This will be handled
       *        sin(degrees) {}             // This will also be handled
       *    }
       */
      ClassMethod(path) {
        injectors.functions.inject({ t, path, ASTType: "ClassMethod" });
      },
      /**
       * Handle ReturnStatements such as:
       *   return "Hello World!";
       */
      ReturnStatement(path) {
        injectors.returns.inject({ t, path, ASTType: "ReturnStatement" });
      },

      VariableDeclaration(path) {
        injectors.variables.inject({ t, path, ASTType: "VariableDeclaration" });
      },
      AssignmentExpression(path) {
        injectors.assignments.inject({ t, path, ASTType: "AssignmentExpression" });
      },
      // ExpressionStatement(path) {
         
      // },
    }
  };
}
