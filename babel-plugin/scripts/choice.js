const fs = require("fs");
const inquirer = require("inquirer");
const { spawn } = require("child_process");

// Configuration
const EXAMPLE_FOLDER = "examples";
const OUT_FOLDER = "out";
const CONFIG_FILE = "./.babelrc-test"

// Scripts
const BUILD = `npx babel ${EXAMPLE_FOLDER}/{FILENAME} --out-file ${OUT_FOLDER}/{FILENAME} --quiet --config-file ${CONFIG_FILE}`;
const RUN = `npm run build && node ./${OUT_FOLDER}/{FILENAME} --config-file ${CONFIG_FILE}`;

const SCRIPTS = {
    build: BUILD,
    "debug:build": `export PLUGIN_DEBUG=1 && npx --node-options=--inspect-brk ${BUILD}`,    
    "run": `${BUILD} && node ./${OUT_FOLDER}/{FILENAME} --config-file ${CONFIG_FILE}`,
    "debug:run": `${BUILD} && node --inspect-brk ./${OUT_FOLDER}/{FILENAME} --config-file ${CONFIG_FILE}`,
}

const getExampleFiles = () => {
    return fs.readdirSync(EXAMPLE_FOLDER);
}

const getFileChoice = () => {
    return new Promise((resolve) => {
        inquirer.default.prompt([
            {
                type: "list",
                name: "file",
                message: "Which example file?",
                choices: getExampleFiles(),
            }])
            .then(answers => resolve(answers.file));
    })
}

const getScriptChoice = () => {
    return new Promise((resolve) => {
        inquirer.default.prompt([
            {
                type: 'list',
                name: 'script',
                message: "Which script would you like to run?",
                choices: Object.keys(SCRIPTS),
            }]).then(answer => resolve(answer.script));
    })
}

(async function () {
    const args = process.argv.slice(2);

    // Select the script name
    let scriptName = args[0];
    if (!scriptName || !SCRIPTS[scriptName]) {
        scriptName = await getScriptChoice();
    }

    let fileName = args[1];
    if (!fileName || !fs.existsSync(`${EXAMPLE_FOLDER}/${fileName}`)) {
        fileName = await getFileChoice();
    }


    const script = SCRIPTS[scriptName].replaceAll("{FILENAME}", fileName);
    const commandParts = script.split(" ");

    try {
        spawn(commandParts[0], commandParts.slice(1), { shell: true, stdio: 'inherit' });
    } catch (e) {
        console.error(e);
    }
})();
