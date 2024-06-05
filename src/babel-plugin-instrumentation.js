module.exports = function (babel) {
  const { types: t, parse } = babel;

  const code = `
function ___instrumentFunction(type, name, lineNumber, args) {
   console.log(name, JSON.parse(JSON.stringify(args)));
}

function ___instrumentReturn(type, lineNumber, value) {
  console.log(type, value);
  return value;
}

function ___captureVariable(type, name, lineNumber, value) {
   console.log(name, JSON.parse(JSON.stringify(value)));
}
`;

  /**
   * Injects a call to capture a function calls arguments
   */
  function injectCapture({ t, path, name = "anonymous", lineNumber, parameters, ASTType }) {
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
  function injectReturn({ t, path, ASTType }) {
    const name = extractName(path);
    const { node } = path;
    const { argument } = node;

    const lineNumber = argument?.loc?.start?.line;
    if (lineNumber === undefined || name && name.startsWith("___")) {
      return;
    }

    const captureReturn = t.callExpression(t.identifier("___instrumentReturn"), [t.stringLiteral(ASTType), t.numericLiteral(lineNumber), argument]);
    path.node.argument = captureReturn;
  }

  /**
   * Should we skip this particular AST node?
   */
  function shouldSkipFunctionCapture(path) {
    // Our internal functions
    const name = extractName(path);
    if (name && name.startsWith("___")) return true;

    if (path.node.loc == undefined || path.node.loc.start === undefined || path.node.loc.start.line === undefined) {
      return true;
    }

    return false;
  }

  /**
   * Should we skip this particular AST node?
   */
  function shouldSkipReturnCapture(path) {
    const { parent } = path;
    const { callee } = parent;

    // This prevents a double instrument occuring when an arrow function
    // is assigned onto a class
    //    class scientificCalculator {
    //       cos = (degrees) => Math.cos(degress * (Math.PI / 180))
    //    }
    if (callee?.name === "_defineProperty") {
      return;
    }
  }

  /**
   * Attempt to extract the name in a safe way that doesn't use null coalescing
   * as this isn't supported by https://astexplorer.net/
   */
  function extractName(path) {
    const { node, parent } = path;

    const name = node.id?.name ??
      node.key?.name ??
      parent?.id?.name ??
      parent?.key?.name;

    if (name) {
      return name;
    }

    // Attempt to handle arrow functions inside a class
    //    class scientificCalculator {
    //       cos = (degrees) => Math.cos(degress * (Math.PI / 180))
    //    }
    if (!name && ["ArrowFunctionExpression", "FunctionExpression"].includes(node.type)) {
      const isInDefineProperty = parent.type === "CallExpression" && parent.callee?.name === "_defineProperty";

      // Force this function to be skipped as we end up with duplicate instrumentation calls
      // so we'll just use the ArrowFunctionExpression instead
      if (node.type === "FunctionExpression" && isInDefineProperty) {
        return "___";
      }

      if (node.type === "ArrowFunctionExpression" && isInDefineProperty) {
        return parent.arguments?.[1]?.value;
      }
    }
  }

  function getLineNumber(path) {
    return path.node.loc?.start?.line ?? path.parent.loc?.start?.line;
  }
  
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
        if (shouldSkipFunctionCapture(path)) { return; }

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
        if (shouldSkipFunctionCapture(path)) { return; }
        
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
        if (shouldSkipFunctionCapture(path)) { return; }

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
        if (shouldSkipFunctionCapture(path)) { return; }

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
        if (shouldSkipReturnCapture(path)) { return; }

        injectReturn({ t, path, ASTType: "ReturnStatement" });
      },
      // ExpressionStatement(path) {
         
      // },
    }
  };
}
