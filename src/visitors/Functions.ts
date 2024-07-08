import { NodePath } from "@babel/core";
import type { FunctionExpression, FunctionDeclaration, ArrowFunctionExpression, ObjectMethod, ClassMethod } from "@babel/types";

import * as utils from "./utils";

type PathType = NodePath<FunctionExpression | FunctionDeclaration | ArrowFunctionExpression | ObjectMethod | ClassMethod>;

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
        const isInDefineProperty = parent.type === "CallExpression" && parent.callee?.name === "_defineProperty";
        const isInCaptureAssignment = parent.type === "CallExpression" && parent.callee?.name === "___captureAssignment";

        // Force this function to be skipped as we end up with duplicate instrumentation calls
        // so we'll just use the ArrowFunctionExpression instead
        if (node.type === "FunctionExpression" && (isInDefineProperty)) {
            return "___";
        }

        if (node.type === "ArrowFunctionExpression" && (isInDefineProperty || isInCaptureAssignment)) {
            return parent.arguments?.[1]?.value;
        }
    }
}


export function visit(t, path: PathType) {
    const name = getName(path);
}
