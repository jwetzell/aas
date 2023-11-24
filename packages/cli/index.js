#!/usr/bin/env node

const { SerialPort } = require('serialport');
const { Console, Packets } = require('aas-lib');
const { writeFileSync } = require('fs');
const { program } = require('commander');

const packageInfo = require('./package.json');

program.name(packageInfo.name);
program.version(packageInfo.version);
program.description('Simple protocol router /s');
program.option('-d, --device <serial port path>', 'serialport path');
program.option('-o, --output <output file>', 'file to write console info to');
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
    aasConsole.update(data);
    if (options.output) {
      writeFileSync(options.output, JSON.stringify(aasConsole, null, 2));
    }
  }
});

port.write(Packets.START_LIVE);

process.on('SIGINT', () => {
  console.log('app: shutting down');
  port.write(Packets.STOP_LIVE);
  port.close();
});
