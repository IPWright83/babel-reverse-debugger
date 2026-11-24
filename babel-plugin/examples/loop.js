const fs = require("fs");

function myExampleProgram(testName) {
    const isTrue = (expression) => {
        if (expression) return true;
        return false;
    }

    const max = (a, b) => {
        if (isTrue(a < b)) { return a; }
        if (isTrue(b < a)) { return b; }
        throw new Error("Argh");
    }

    let current = 1;

    for (let i = 0; i < 10; i++) {
        current = max(current, i);
    }

    return current;
}

debugger;
const hello = "Hello World";
const result = myExampleProgram("Example");
console.log(result);
// _currentNode.start().walk();

const json = _currentNode.serialize();
fs.writeFileSync("../debugger/src/debug.json", json, { encoding: "utf8" });
// start.walk();
