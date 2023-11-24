#!/usr/bin/env node

const { SerialPort } = require('serialport');
const { Console, Packets } = require('aas-lib');
const { writeFileSync } = require('fs');
const { program, Option } = require('commander');

const packageInfo = require('./package.json');

program.name(packageInfo.name);
program.version(packageInfo.version);
program.description('Simple protocol router /s');
program.option('-d, --device <serial port path>', 'serialport path');
program.option('-o, --output <output file>', 'file to write console info to');
program.addOption(new Option('-f, --format <output format>').choices(['json']).default('json'));
program.parse(process.argv);

const options = program.opts();
if (!options.device) {
  console.error('app: no device specified');
  process.exit(1);
}

const aasConsole = new Console();
const port = new SerialPort({
  path: options.device,
  baudRate: 76800,
});

port.on('error', (error) => {
  console.error('app: problem with serial port');
  console.error(error.message);
});

// Switches the port into "flowing mode"
port.on('data', (data) => {
  if (aasConsole) {
    try {
      aasConsole.update(data);
      console.log('app: console data updated');
    } catch (error) {
      console.error('app: error updating console state');
    }
    if (options.output) {
      try {
        if (options.format === 'json') {
          writeFileSync(options.output, JSON.stringify(aasConsole, null, 2));
        }
      } catch (error) {
        console.error(`app: problem writing to output file -> ${options.output}`);
      }
    }
  }
});

const initializeInterval = setInterval(function initialize() {
  if (aasConsole.sportInitialized) {
    clearInterval(this);
  } else if (port) {
    console.log('app: requesting console data to start streaming');
    port.write(Packets.START_LIVE);
  }
}, 1000);

process.on('SIGINT', () => {
  console.log('app: shutting down');
  clearInterval(initializeInterval);
  port.write(Packets.STOP_LIVE);
  port.close();
});
