import { Statement } from "./Statement";

/**
 * Represents the entry point into the program
 */
export class ProgramStatement extends Statement {
  constructor() {
    super("Program", 0);
  }

  log() {}
}
