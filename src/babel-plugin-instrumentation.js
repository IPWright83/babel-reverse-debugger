module.exports = function (babel) {
  const { types: t, parse } = babel;

  const code = `
function ___instrumentFunction(type, name, lineNumber, args) {
   console.log(name, JSON.parse(JSON.stringify(args)));
}

function ___instrumentReturn(type, lineNumber, value) {
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
  function injectReturn({ t, path, ASTType }) {
    const { node, parent } = path;
    const { argument } = node;
    const { callee } = parent;

    // This prevents a double instrument occuring when an arrow function
    // is assigned onto a class
    //    class scientificCalculator {
    //       cos = (degrees) => Math.cos(degress * (Math.PI / 180))
    //    }
    if (callee?.name === "_defineProperty" && ASTType === "ArrowFunctionExpression") {
      return;
    }

    const lineNumber = argument?.loc?.start?.line;
    if (lineNumber === undefined) {
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
    if (name.startsWith("___")) return true;

    if (path.node.loc == undefined || path.node.loc.start === undefined || path.node.loc.start.line === undefined) {
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

    return node.id?.name ??
      node.key?.name ??
      parent?.id?.name ??
      parent?.key?.name ??
      // This is used to extract out function names from return statements
      // and helps prevent us nesting an ___injectReturn inside the ___injectReturn itself
      path.findParent((p) => t.isFunction(p))?.node?.id?.name ??
      "anonymous";
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
          injectReturn({ t, path, ASTType: "ReturnStatement" });
      },
      // ExpressionStatement(path) {
         
      // },
    }
  };
}
