#!/usr/bin/env node
const argv = require('yargs').argv
const cwd = process.cwd()
const { execSync } = require('child_process')

const inputFile = argv.i || argv.input
const outputFile = argv.o || argv.output
const plainArgs = argv._
if (!(inputFile && outputFile && plainArgs.length === 0) && (!inputFile && !outputFile && plainArgs.length < 2)) {
  console.log(`Usage:
$ faastest-bundle -i [inputFile] -o [outputFile]
$ faastest-bundle [inputFileGlob] [outputFolder]
`)
  process.exit(1)
}

if (inputFile && outputFile) {
  execSync(`${__dirname}/../node_modules/.bin/rollup ${cwd}/${inputFile} -c ${__dirname}/../rollup.config.js --format=cjs > ${cwd}/${outputFile}`)
} else {
  const outputFolder = plainArgs.pop()
  plainArgs.forEach(inputFile => {
    const outputFile = inputFile.split('/').pop()
    execSync(`${__dirname}/../node_modules/.bin/rollup ${cwd}/${inputFile} -c ${__dirname}/../rollup.config.js --format=cjs > ${cwd}/${outputFolder}/${outputFile}`)
  })
}
