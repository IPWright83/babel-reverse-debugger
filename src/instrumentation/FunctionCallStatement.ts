import type { FunctionExpression, FunctionDeclaration, ArrowFunctionExpression, ObjectMethod, ClassMethod } from "@babel/types";
import { Statement } from "./Statement";

type FunctionNodeType = FunctionExpression | FunctionDeclaration | ArrowFunctionExpression | ObjectMethod | ClassMethod;

export class FunctionCallStatement extends Statement {
    public branch: Statement;
    public name: string;
    public args: Record<string, any>;

    /**
     * Construct a new FunctionCall Statement
     * @param nodeType      The type of the AST Node
     * @param name          The name of the function called
     * @param lineNumber    The line number in the code that this statement corresponds to
     * @param args          The arguments passed to the function
     */
    constructor(nodeType: FunctionNodeType["type"], name: string, lineNumber: number, args: Record<string, any>) {
        super(nodeType, lineNumber);

        this.name = name;
        this.args = args;
    }

    /**
    * Add a new statement to the chain
    * @param  {Statement} statement    The statement to add
    * @return {Statement}              The newly added statement
    */
    add(statement: Statement): Statement {
        this.branch = statement;

        // When a function is called we go deeper in the stack
        statement.depth = this.depth + 1;
        statement.prev = this;

        return statement;
    }

    log() {
        console.debug("\x1b[32m%s\x1b[0m", this.lineNumber + ": Function Call " + this.name + "(" + JSON.stringify(this.args) + ")");
    }
}
