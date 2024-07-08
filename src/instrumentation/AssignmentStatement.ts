import type { VariableDeclaration, AssignmentExpression, UpdateExpression } from "@babel/types";
import { Statement } from "./Statement";

type AssignmentNodeType = VariableDeclaration | AssignmentExpression | UpdateExpression;

export class AssignmentStatement extends Statement {
    public name: string;
    public value: any;
    public displayValue: any;

    constructor(nodeType: AssignmentNodeType["type"], name: string, lineNumber: number, displayValue: any, value: any) {
        super(nodeType, lineNumber);

        this.name = name;
        this.value = value;
        this.displayValue = displayValue;
    }

    log() {
        console.debug("\x1b[33m%s\x1b[0m", this.lineNumber + ": Assignment " + name + " = " + JSON.stringify(this.displayValue));
    }
}



