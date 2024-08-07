/**
 * Assignments & Expressions
 */
const fixedCount = 8;
let count = 1;
count = 4;
count++;
count += 1;
const w = 4, x = 3;//66acad
var y, z = 54;
const obj = { foo: { bar: "baz" } };

/**
 * Functions
 */
function add(a, b) {
  return a + b;
}

const subtract = (a, b) => a - b;

const calculator = {
  add: (a, b) => { return a + b; }, 
  subtract: function (a, b) { return a - b; },
  multiply: (a, b) => a * b,
  divide: (a, b) => { return a / b; },
};
 
class scientificCalculator {
  constructor(name) {
    this.name = name;
  }
  
  sin(degrees) {
    return Math.sin(degrees * (Math.PI / 180))
  }

  cos = (degrees) => Math.cos(degrees * (Math.PI / 180))
}

const foo = () => {
  const bar = () => {
    return () => {
      return "baz";
    }
  }
}

(function (a, b) {
  return a + b;
})(3, 4);

// Assign some values
const a = add(1, 3);
console.log(`Result of 4-1 = ${subtract(4, 1)}`);
const result = {
  add: calculator.add(1, 7),
  subtract: calculator.subtract(8, 1),
};
result.multiply = calculator.multiply(1, 6);

const betterCalc = new scientificCalculator("Ian's Calculator");
betterCalc.sin(180);
betterCalc.cos(180);

console.log(`Result of 14/2 = ${calculator.divide(14, 2)}`);
_currentNode.start().walk();
debugger;
