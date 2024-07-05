let ___currentNode = new ___ProgramNode();

function ___instrumentFunction(nodeType, name, lineNumber, args) { 
  ___currentNode = ___currentNode.add(new FunctionCallNode(nodeType, name, lineNumber, args));
}

function ___instrumentReturn(nodeType, lineNumber, value) {
  ___currentNode = ___currentNode.add(new ReturnNode(nodeType, lineNumber, value));
}

function ___captureAssignment(nodeType, name, lineNumber, displayValue, value) {
  ___currentNode = ___currentNode.add(new AssignmentNode(nodeType, name, lineNumber, displayValue, value));
}

/**
  * Construct a new Node
  * @param  {string} nodeType   The AST node type
  * @param  {number} lineNumber The line number that this node corresponds to
  * @param  {number} depth      The depth in the callstack
  */
function ___Node(nodeType, lineNumber) { 
  return {
    next: undefined,
    prev: undefined,
    isDebug: process.env.PLUGIN_DEBUG === '1',
    depth: 0,

    // This is used to allow stepping backwards into
    // a function call from a return statement
    branch_rewind: undefined, 
  }
}


class ___Node {
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
   * @param {___Node} node  The next node
   */
  add(node) {
    this.next = node;

    // Update the next node to point
    // back to this one    
    node.prev = this;
    node.depth = depth;
    
    return node;
  }
}

class ___ProgramNode extends ___Node {
  constructor() {
    super("PROGRAM", 0);
  }
}

class ___FunctionCallNode extends ___Node {
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

    this.isDebug && console.log("\x1b[32m%s\x1b[0m", lineNumber + ": Function Call " + name + "(" + JSON.stringify(args) + ")");
  }

  /**
   * Override the add function to manage branches
   * @param {___Node} node  The next node
   */
  add(node) {
    this.branch = node;

    // When a function is called we go deeper in the stack
    node.depth = this.depth + 1;
    node.prev = this;

    return node;
  }
}

class ___ReturnNode extends ___Node {
  /**
   * [constructor description]
   * @param  {string} nodeType          The AST node type
   * @param  {number} lineNumber        The line number that this node corresponds to
   * @param  {any}    value             The value being returned
   */
  constructor(nodeType, lineNumber, value) {
    super(nodeType, lineNumber);

    this.value = value;

    this.isDebug && console.log("\x1b[34m%s\x1b[0m", lineNumber + ": Returning " + value);
  }

  /**
   * Find the previous Node that was at a higher depth
   * @return {___Node}
   */
  findPrev() {
    let searchNode = node.prev;

    while (searchNode.depth !== this.depth - 1) {
      searchNode = searchNode.prev;
    }

    return searchNode;
  }

  /**
   * Override the return function to manage unbranching
   * @param {___Node} node  The next node
   */
  add(node) {
    this.next = node;

    // When we return from a function we go back up the stack
    node.depth = this.depth - 1;
    node.branch_rewind = this;

    // Set the previous node, to the last
    // node at the same depth
    node.prev = this.findPrev(this.depth);

    return node;
  }
}

class ___AssignmentNode extends ___Node {
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

    this.isDebug && console.log("\x1b[33m%s\x1b[0m", lineNumber + ": Assignment " + name + " = " + JSON.stringify(displayValue));
  }
}
