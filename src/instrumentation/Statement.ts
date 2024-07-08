import type { Node } from "@babel/types";
import { stat } from "fs";

export abstract class Statement {
    // Next statement in the chain
    public next?: Statement;

    // Previous statement in the chain
    public prev?: Statement;

    // The call stack depth of the current statement
    public depth: number = 0;

    // This is used to allow stepping backwards into a function call from a return statement
    public branch_rewind?: Statement;

    // The type of this AST Node
    protected nodeType: Node["type"] | "Program";

    protected lineNumber: number;

    /**
     * Construct a new Node
     * @param nodeType      The type of the AST Node
     * @param lineNumber    The line number in the code that this statement corresponds to
     */
    constructor(nodeType: Node["type"] | "Program", lineNumber: number) {
        this.nodeType = nodeType;
    }

    /**
     * Add a new statement to the chain
     * @param  {Statement} statement    The statement to add
     * @return {Statement}              The newly added statement
     */
    add(statement: Statement): Statement {
        this.next = statement;

        // Update the next node to point back to this one
        statement.prev = this;
        statement.depth = this.depth;

        return statement;
    }

    abstract log(): void;
}
