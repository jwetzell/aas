#!/usr/bin/env node

const { SerialPort } = require('serialport');
const { Console, Packets } = require('aas-lib');
const { writeFileSync } = require('fs');
const { program, Option } = require('commander');
const { WebSocketServer } = require('ws');
const { XMLBuilder } = require('fast-xml-parser');
const { stringify: yamlify } = require('yaml');
const Select = require('@inquirer/select');
const packageInfo = require('./package.json');

program.name(packageInfo.name);
program.version(packageInfo.version);
program.description('AAS Serial Decoder');
program.option('-d, --device <serial port path>', 'serialport path');
program.option('-o, --output <output file>', 'file to write console info to');
program.addOption(new Option('-f, --format <output format>').choices(['json', 'xml', 'yaml']).default('json'));
program.option('--websocket <port>', 'enable websocket server for updates', undefined);
program.parse(process.argv);

const options = program.opts();

let ws;
let updateTimeout;
let xmlBuilder;

function sendToWSClients(payload) {
  if (ws && ws.clients) {
    ws.clients.forEach((socket) => {
      socket.send(JSON.stringify(payload));
    });
  }
}

function setup(devicePath) {
  if (!devicePath) {
    console.log('app: device must not be undefined');
    return;
  }
  if (options.websocket) {
    ws = new WebSocketServer({ port: options.websocket });
  }

  const aasConsole = new Console();
  const port = new SerialPort({
    path: devicePath,
    baudRate: 76800,
  });

  port.on('error', (error) => {
    console.error('app: problem with serial port');
    console.error(error.message);
  });

  port.on('data', (data) => {
    if (aasConsole) {
      try {
        aasConsole.update(data);
        console.log('app: console state update received');
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(() => {
          console.log('app: console update timed out re-initializing');
          aasConsole.reset();
        }, 1000);
        if (ws) {
          sendToWSClients({
            eventName: 'update',
            data: aasConsole.toJSON(),
          });
        }
      } catch (error) {
        console.error('app: error updating console state');
      }
      if (options.output && aasConsole.sportInitialized) {
        try {
          let outputString;
          if (options.format === 'json') {
            outputString = JSON.stringify(aasConsole, null, 2);
          } else if (options.format === 'xml') {
            if (!xmlBuilder) {
              xmlBuilder = new XMLBuilder();
            }
            outputString = xmlBuilder.build({ console: aasConsole.toJSON() });
          } else if (options.format === 'yaml') {
            outputString = yamlify(aasConsole.toJSON());
          }
          if (outputString) {
            writeFileSync(options.output, outputString);
          }
        } catch (error) {
          console.error(`app: problem writing to output file -> ${options.output}`);
        }
      }
    }
  });

  const initializeInterval = setInterval(() => {
    if (aasConsole.sportInitialized) {
      console.log('app: console is already initialized');
    } else if (port) {
      console.log('app: requesting console data to start streaming');
      port.write(Packets.START_LIVE);
      if (ws) {
        sendToWSClients({ eventName: 'initializing' });
      }
    }
  }, 1000);

  process.on('SIGINT', () => {
    console.log('app: shutting down');
    clearTimeout(updateTimeout);
    clearInterval(initializeInterval);
    if (ws) {
      if (ws.clients) {
        ws.clients.forEach((socket) => {
          socket.close();
        });
      }
      ws.close();
    }
    port.write(Packets.STOP_LIVE);
    port.close();
  });
}

if (!options.device) {
  console.error('app: no device specified');
  SerialPort.list().then((ports) => {
    console.log('app: available devices');
    const choices = ports.map((port) => ({
      name: port.path,
      value: port.path,
    }));
    Select.default({
      message: 'Select a device',
      choices,
    }).then((value) => {
      if (value) {
        setup(value);
      }
    });
  });
} else {
  setup(options.device);
}
