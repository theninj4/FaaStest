#!/usr/bin/env node
const argv = require('yargs').argv
const cwd = process.cwd()
const { execSync } = require('child_process')

const inputFile = argv.i || argv.input
const outputFile = argv.o || argv.output
if (!inputFile || !outputFile) {
  console.log(`Usage:
$ faatest-bundle -i [inputFile] -o [outputFile]
`)
  process.exit(1)
}

execSync(`${__dirname}/../node_modules/.bin/rollup ${cwd}/${inputFile} -c ${__dirname}/../rollup.config.js --format=cjs > ${cwd}/${outputFile}`)
