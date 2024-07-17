function _instrumentFunction(nodeType, name, lineNumber, args) { 
  _currentNode = _currentNode.add(new _FunctionCallStatement(nodeType, name, lineNumber, args));
}

function _instrumentReturn(nodeType, lineNumber, value) {
  _currentNode = _currentNode.add(new _ReturnValueStatement(nodeType, lineNumber, value));
  return value;
}

function _captureAssignment(nodeType, name, lineNumber, displayValue, value) {
  _currentNode = _currentNode.add(new _AssignmentStatement(nodeType, name, lineNumber, displayValue, value));
  return value;
}

class _Statement {
  /**
   * Construct a new Node
   * @param  {string} nodeType   The AST node type
   * @param  {number} lineNumber The line number that this node corresponds to
   * @param  {number} depth      The depth in the callstack
   */
  constructor(nodeType, lineNumber) {
    this.next = undefined;
    this.prev = undefined;
    this.isDebug = process.env.PLUGIN_DEBUG === '1';
    this.depth = 0;

    // This is used to allow stepping backwards into
    // a function call from a return statement
    this.branch_rewind = undefined;

    this.nodeType = nodeType;
    this.lineNumber = lineNumber;
  }

  /**
   * Add a new node into the chain
   * @param {_Statement} node  The next node
   */
  add(node) {
    this.next = node;

    // Update the next node to point
    // back to this one    
    node.prev = this;
    node.depth = this.depth;
    
    return node;
  }

  log() {}

  /**
   * Return the _Statement at the start of the tree
   */
  start() {
    let current = this;

    while (current.prev) {
      current = current.prev;
    }

    return current;
  }

  walk() {
    let current = this;

    while (current) {
      current.log();
      current = current.branch ?? current.next;
    }
  }
}

class _ProgramStatement extends _Statement {
  constructor() {
    super("PROGRAM", 0);
  }

  log() {}
}

class _FunctionCallStatement extends _Statement {
  /**
   * Construct a new FunctionCall Node
   * @param  {string} nodeType          The AST node type
   * @param  {string} name              The name of the function being called
   * @param  {number} lineNumber        The line number that this node corresponds to
   * @param  {Record<string|any>} args  The set of arguments passed to the function
   */
  constructor(nodeType, name, lineNumber, args) {
    super(nodeType, lineNumber);

    this.branch = undefined;
    this.name = name;
    this.args = args;
  }

  /**
   * Override the add function to manage branches
   * @param {_Statement} node  The next node
   */
  add(node) {
    this.branch = node;

    // When a function is called we go deeper in the stack
    node.depth = this.depth + 1;
    node.prev = this;

    return node;
  }

  log() {
    const tabs = ' '.repeat(this.depth)
    console.debug("\x1b[32m%s\x1b[0m", `${tabs}\\ ${this.name}(${JSON.stringify(this.args)}) :${this.lineNumber}`);
  }
}

class _ReturnValueStatement extends _Statement {
  /**
   * [constructor description]
   * @param  {string} nodeType          The AST node type
   * @param  {number} lineNumber        The line number that this node corresponds to
   * @param  {any}    value             The value being returned
   */
  constructor(nodeType, lineNumber, value) {
    super(nodeType, lineNumber);
    this.value = value;
  }

  /**
   * Find the previous Node that was at a higher depth
   * @return {_Statement}
   */
  findPrevious() {
    let searchNode = this.prev;

    while (searchNode.depth !== this.depth - 1) {
      searchNode = searchNode.prev;
    }

    return searchNode;
  }

  /**
   * Override the return function to manage unbranching
   * @param {_Statement} node  The next node
   */
  add(node) {
    this.next = node;

    // When we return from a function we go back up the stack
    node.depth = this.depth - 1;
    node.branch_rewind = this;

    // Set the previous node, to the last
    // node at the same depth
    node.prev = this.findPrevious(this.depth);

    return node;
  }

  log() {
    const tabs = ' '.repeat(this.depth - 1)
    console.log("\x1b[34m%s\x1b[0m", `${tabs} / return ${this.value} :${this.lineNumber} `);
  }
}

class _AssignmentStatement extends _Statement {
  /**
   * Construct a new Assignment Node
   * @param  {string} nodeType          The AST node type
   * @param  {string} name              The name of the variable being assigned to
   * @param  {number} lineNumber        The line number that this node corresponds to
   * @param  {string} displayValue      The value to be displayed to the user
   * @param  {any} value                The actual value
   */
  constructor(nodeType, name, lineNumber, displayValue, value) {
    super(nodeType, lineNumber);

    this.name = name;
    this.value = value;
    this.displayValue = displayValue;
  }

  log() {
    const tabs = " ".repeat(this.depth)
    console.log("\x1b[33m%s\x1b[0m", `${tabs}| ${this.name} = ${JSON.stringify(this.displayValue)} : ${this.lineNumber} `);
  }
}

let _currentNode = new _ProgramStatement();
