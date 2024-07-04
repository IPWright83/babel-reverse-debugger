function myExampleProgram() {
    const max = (a, b) => {
        if (a < b) { return a; }
        if (b < a) { return b; }
        throw new Error("Argh");
    }

    let current = 1;

    for (let i = 0; i < 10; i++) {
        current = max(current, i);
    }

    return current;
}

const hello = "Hello World";
const result = myExampleProgram();
console.log(result);
