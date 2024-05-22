const { exec } = require('child_process');
const path = require('path');

const runTransform = (path) => {
    return new Promise((resolve, reject) => {
        const command = `npx babel ${path} --quiet`;
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
    ])("Converts %s correctly", async (name, inputFile) => {
        const filePath = path.resolve(__dirname, inputFile);
        const output = await runTransform(filePath);
        expect(output).toMatchSnapshot();
    });
});
