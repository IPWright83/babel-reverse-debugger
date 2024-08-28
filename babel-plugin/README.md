# Babel-Plugin

The babel-plugin part of this repo is the bit that does the hard work in tracking the code that's executed. It does this by way of (no surprises here) a babel plugin that effectively injects instrumentation code to record various things such as function calls, arguments passed and return values.

A small piece of instrumentation code in injected into the codebase to do this, and as the instrumentation functions are called it creates a graph of "Statements" that can be interrogate later on.

## Getting Started

First you need to install the dependencies for this package:

`npm install`

### Running Tests

To run the tests you can simply run:

 `npm run test`

 The tests currently take in a source file, run the babel transpiler against it with this plugin, and then verify that the output generated matches a snapshot. Care should be taken when reviewing these snapshots to ensure that any changes are actually intentional and maintain functionality.

### Transpiling a file

The simplest way to try transpiling a file with this plugin is to create a file within the examples directory and then run:

`npm start`

You should be prompted to choose a script (select `build`) and then to select a file. This will run babel against your file and place the contents in `out/{filename}`. 

> This uses the `.babelrc-test` file to set the various babel plugins. Currently this doesn't have any other plugins (e.g. TypeScript) so you may need to tweak this for your file. This is kept separate from the `.babelrc` as that interferes with some other tools (Wallaby.js)

### Running a Transpiled File

If you wish to execute the transpiled output to make it works you can run:

`npm start`

You should be prompted to choose a script (select `run`) and then to select a file. This will run babel against your file and then execute the output using node.
