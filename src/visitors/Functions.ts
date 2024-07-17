import { NodePath } from "@babel/core";
import type { FunctionExpression, FunctionDeclaration, ArrowFunctionExpression, ObjectMethod, ClassMethod } from "@babel/types";

import * as utils from "./utils";

type PathType = NodePath<FunctionExpression | FunctionDeclaration | ArrowFunctionExpression | ObjectMethod | ClassMethod>;

/**
  * Should we skip this particular AST node?
  */
function skip(name, path) {
    // Our internal functions
    if (name && name.startsWith("___")) return true;

    // Code that we don't have any line numbers for
    if (path.node.loc == undefined || path.node.loc.start === undefined || path.node.loc.start.line === undefined) {
        return true;
    }

    return false;
}

function getName(path: PathType) {
    const { node, parent } = path;

    const name = utils.getName(path);
    if (name) {
        return name;
    }

    // Attempt to handle arrow functions inside a class
    //    class scientificCalculator {
    //       cos = (degrees) => Math.cos(degress * (Math.PI / 180))
    //    }
    if (["ArrowFunctionExpression", "FunctionExpression"].includes(node.type)) {
        // @ts-expect-error
        const isInDefineProperty = parent.type === "CallExpression" && parent.callee?.name === "_defineProperty";
        // @ts-expect-error
        const isInCaptureAssignment = parent.type === "CallExpression" && parent.callee?.name === "___captureAssignment";

        // Force this function to be skipped as we end up with duplicate instrumentation calls
        // so we'll just use the ArrowFunctionExpression instead
        if (node.type === "FunctionExpression" && (isInDefineProperty)) {
            return "___";
        }

        if (node.type === "ArrowFunctionExpression" && (isInDefineProperty || isInCaptureAssignment)) {
            // @ts-expect-error
            return parent.arguments?.[1]?.value;
        }
    }
}


export function visit(t, path: PathType, ASTType: string) {
    const name = getName(path);
    if (skip(name, path)) { return; }

    utils.isDebug && console.debug("functions.inject");

    const lineNumber = utils.getLineNumber(path);
    const parameters = path.node.params.map(p =>
        t.objectProperty(t.identifier(p.name), t.identifier(p.name))
    );

    const captureStart = t.expressionStatement(
        t.callExpression(t.identifier("___instrumentFunction"), [
            t.stringLiteral(ASTType),
            t.stringLiteral(name || "anonymous"), // Use extracted name or default to "anonymous"
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

    // @ts-expect-error: This is a field that we're adding in
    // Mark this node as processed to avoid re-processing
    path.node.__processed = true;
}
