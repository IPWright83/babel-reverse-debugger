import { useState } from "react";
import { Code } from "./Code";

import './App.css';

import json from "./debug.json";
import { _Statement } from "./instrumentation";

const statement = _Statement.deserialize(JSON.stringify(json));


function App() {
  const [node, setNode] = useState(statement.next);

  console.log(node);
  const codeString = `const fs = require("fs");

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
// start.walk();`;
  return (
    <div className="App" >
      <div className="buttons" style={{ position: "fixed", display: "flex", flexDirection: "row", justifyContent: "flex-end", width: "100%" }}>
        <button disabled={!node.next} onClick={() => setNode(node.next)}>Step Forwards</button>
        <button disabled={!node.prev} onClick={() => setNode(node.prev)}>Step Back</button>
        <button disabled={!node.branch} onClick={() => setNode(node.branch)}>Step Into</button>
        <button disabled={!node.branch_rewind} onClick={() => setNode(node.branch_rewind)}>Reverse Into</button>
      </div >
      <Code code={codeString} selection={node} />
      <div style={{ position: "fixed", bottom: 0, background: "#CCC", width: "100%" }}>{node.toString()}</div>
    </div >
  );
}

export default App;
