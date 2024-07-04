class Node {
  constructor(lineNumber) {
    this.lineNumber = lineNumber;
    this.next = undefined;
    this.prev = undefined;
  }

  add(node) {
    this.next = node;
    node.prev = this;
  }
}

class FunctionNode extends Node {
  constructor(name, lineNumber) {
    super(lineNumber, args);
    this.name = name;
    this.args = args;
  }
}

class ReturnNode extends Node {
  constructor(value, lineNumber) {
    super(lineNumber);
    this.value = value;
  }
}

class AssignmentNode extends Node {
  constructor(name, displayValue, value, lineNumber) {
    super(lineNumber);
    this.name = name;
    this.value = value;
    this.displayValue = displayValue;
  }
}


