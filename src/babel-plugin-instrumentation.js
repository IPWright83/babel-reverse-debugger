module.exports = function (babel) {
  const { types: t, parse } = babel;

  const code = `
function ___instrumentFunction(type, name, lineNumber, args) {
   console.log(name, JSON.parse(JSON.stringify(args)));
}

function ___instrumentReturn(value) {
  console.log(value);
  return value;
}

function ___captureVariable(type, name, lineNumber, value) {
   console.log(name, JSON.parse(JSON.stringify(value)));
}
`;

  /**
   * Injects a call to capture a function calls arguments
   */
  function injectCapture({t, path, name, lineNumber, parameters, ASTType}) {
    const captureStart = t.expressionStatement(
      t.callExpression(t.identifier("___instrumentFunction"), [
        t.stringLiteral(ASTType),
        t.stringLiteral(name),
        t.numericLiteral(lineNumber),
        t.objectExpression(parameters)
      ])
    );

    if (t.isBlockStatement(path.node.body)) {
      path.get("body").unshiftContainer("body", captureStart);
    } else {
      const body = t.blockStatement([captureStart, t.returnStatement(path.node.body)]);
      path.get('body').replaceWith(body);
    }
  }

  /**
   * Injects the recording of a value return from a function
   */
  function injectReturn({ t, path, lineNumber, argument, ASTType }) {
    // Ensure we don't instrument our own function
    const functionName = path.findParent((p) => t.isFunction(p))?.node?.id?.name;
    if (shouldSkip(path)) {
      return;
    }

    const captureReturn = t.callExpression(t.identifier("___instrumentReturn"), [argument]);
    path.node.argument = captureReturn;
  }

  /**
   * Should we skip this particular AST node?
   */
  function shouldSkip(path) {
    // Our internal functions
    const name = extractName(path);
    if (name.startsWith("___")) return true;

    if (path.node.loc == undefined || path.node.loc.start === undefined || path.node.loc.start.line === undefined) {
      return true;
    }

    // This prevents a double instrument occuring when an arrow function
    // is assigned onto a class
    //    class scientificCalculator {
    //       cos = (degrees) => Math.cos(degress * (Math.PI / 180))
    //    }
    if (path.parent.callee && path.parent.callee.name === "_defineProperty" && path.node.type === "ArrowFunctionExpression") {
      return true;
    }

    return false;
  }

  /**
   * Attempt to extract the name in a safe way that doesn't use null coalescing
   * as this isn't supported by https://astexplorer.net/
   */
  function extractName(path) {
    const { node, parent } = path;

    if (node.id && node.id.name) {
      return node.id.name;
    }

    if (node.key && node.key.name) {
      return node.key.name;
    }

    if (parent.id && parent.id.name) {
      return parent.id.name;
    }

    if (parent.key && parent.key.name) {
      return parent.key.name;
    }

    // This is used to extract out function names from return statements
    // and helps prevent us nesting an ___injectReturn inside the ___injectReturn itself
    const parentFunction = path.findParent((p) => t.isFunction(p));
    if (parentFunction && parentFunction.node && parentFunction.node.id) {
      return parentFunction.node.id.name;
    }

    return "anonymous";
  }

  function getLineNumber(path) {
    if(path.node.loc && path.node.loc.start && path.node.loc.start.line !== undefined) {
      return path.node.loc.start.line;
    }

    if (path.parent.loc && path.parent.loc.start && path.parent.loc.start.line !== undefined) {
      return path.parent.loc.start.line;
    }

    return undefined;
  }
  
  return {
    visitor: {
      Program(path) {
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
        if (shouldSkip(path)) { return; }

        const name = extractName(path);
        const lineNumber = getLineNumber(path);
        const parameters = path.node.params.map((p) =>
          t.objectProperty(t.identifier(p.name), t.identifier(p.name))
        );

        injectCapture({ t, path, name, lineNumber, parameters, ASTType: "FunctionDeclaration" });
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
        if (shouldSkip(path)) { return; }
        
        const name = extractName(path);
        const lineNumber = getLineNumber(path);
        const parameters = path.node.params.map((p) =>
          t.objectProperty(t.identifier(p.name), t.identifier(p.name))
        );
        
        injectCapture({ t, path, name, lineNumber, parameters, ASTType: "FunctionExpression" });
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
        if (shouldSkip(path)) { return; }

        const name = extractName(path);
        const lineNumber = getLineNumber(path);
        const parameters = path.node.params.map((p) =>
          t.objectProperty(t.identifier(p.name), t.identifier(p.name))
        );

        injectCapture({ t, path, name, lineNumber, parameters, ASTType: "ArrowFunctionExpression" });
      },
      /**
       * Handle ClassMethods such as:
       *    class ScientificCalculator {
       *        constructor() {}            // This will be handled
       *        sin(degrees) {}             // This will also be handled
       *    }
       */
      ClassMethod(path) {
        if (shouldSkip(path)) { return; }

        const name = extractName(path);
        const lineNumber = getLineNumber(path);
        const parameters = path.node.params.map((p) =>
          t.objectProperty(t.identifier(p.name), t.identifier(p.name))
        );

        injectCapture({ t, path, name, lineNumber, parameters, ASTType: "ClassMethod" });
      },
      /**
       * Handle ReturnStatements such as:
       */
      ReturnStatement(path) {
          const lineNumber = path.node.loc;
          const argument = path.node.argument;

          injectReturn({ t, path, lineNumber, argument, ASTType: "ReturnStatement" });
      },
      // ExpressionStatement(path) {
         
      // },
    }
  };
}
