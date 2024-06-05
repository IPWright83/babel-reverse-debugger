const { exec } = require('child_process');
const path = require('path');

const runTransform = (inputFile) => {
    return new Promise((resolve, reject) => {
        const configFile = path.resolve(__dirname) + "/../../.babelrc-test";
        const command = `npx babel ${inputFile} --quiet --config-file ${configFile}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }

            if (stderr) {
                reject(stderr.trim());
            }

            resolve(stdout.trim());
        })
    })
};

describe("Function Decorators", () => {
    test.each([
        ["Basic function", "basic-function.js"],
        ["Arrow function", "arrow-function.js"],
        ["IIFE", "immediately-invoked-function-expression.js"],
        ["Object with arrow function (implicit return)", "object-arrow-shorthand-return.js"],
        ["Object with arrow function (explicit return)", "object-arrow-full-return.js"],
        ["Object with function", "object-function.js"],
        ["Object with function (no return)", "object-function-no-return.js"],
        ["Object with functions", "object-all.js"],
        ["New Function by skipping it", "new-function.js"],
        ["Class Constructor", "class-constructor.js"],
        ["Class Function", "class-function.js"],
        ["Class arrow function", "class-arrow-function.js"]
    ])("Converts %s correctly", async (name, inputFile) => {
        const filePath = path.resolve(__dirname, inputFile);
        const output = await runTransform(filePath);
        expect(output).toMatchSnapshot();
    });
});
