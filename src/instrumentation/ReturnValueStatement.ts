import type { ReturnStatement } from "@babel/types";
import { Statement } from "./Statement";

export class ReturnValueStatement extends Statement {
    public value: any;

    /**
     * Construct a new FunctionCall Statement
     * @param nodeType      The type of the AST Node
     * @param lineNumber    The line number in the code that this statement corresponds to
     * @param value         The value being returned
     */
    constructor(nodeType: ReturnStatement["type"], lineNumber: number, value: any) {
        super(nodeType, lineNumber);
        this.value = value;
    }

    /**
    * Add a new statement to the chain
    * @param  {Statement} statement    The statement to add
    * @return {Statement}              The newly added statement
    */
    add(statement: Statement): Statement {
        this.next = statement;

        // When we return from a function we go back up the stack
        statement.depth = this.depth - 1;
        statement.branch_rewind = this;

        // Set the previous statement, to the last at the same depth
        statement.prev = this.findPrevious();

        return statement;
    }

    /**
     * Find the previous Node that was at a higher depth
     */
    findPrevious() {
        let searchItem = this.prev;

        while (searchItem?.depth !== this.depth - 1) {
            searchItem = searchItem?.prev;
        }

        return searchItem;
    }

    log() {
        console.log("\x1b[34m%s\x1b[0m", this.lineNumber + ": Returning " + this.value);
    }
}
