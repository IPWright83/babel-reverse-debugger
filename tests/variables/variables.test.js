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

describe("Variable Decorators", () => {
    test.each([
        ["const assignment", "const-assignment.js"],
        ["let assignment", "let-assignment.js"],
        ["var assignment", "var-assignment.js"],
        ["multi value assignment", "multi-assignment.js"],
        ["String", "string-assignment.js"],
        ["Boolean", "bool-assignment.js"],
        ["Function", "function-assignment.js"],
        ["Arrow Function", "arrow-assignment.js"],
        ["Object", "object-assignment.js"],
        ["Re-assignment", "re-assignment.js"],
        ["Increment++", "incrementplusplus.js"],
        ["Increment+=", "incrementplusequals.js"],
        // ["Assign to Undefined", "assign-to-undefined.js"],
        // ["Assign to operation", "assign-to-operation.js"],
        // ["Assign to function result", "assign-to-func-result.js"],
        // ["Assign to built in function result", "assign-to-builtin-result.js"]
    ])("Converts %s correctly", async (name, inputFile) => {
        const filePath = path.resolve(__dirname, inputFile);
        const output = await runTransform(filePath);
        expect(output).toMatchSnapshot();
    });
});
