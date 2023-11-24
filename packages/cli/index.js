#!/usr/bin/env node

const { SerialPort } = require('serialport');
const { Console, Packets } = require('aas-lib');
const { writeFileSync } = require('fs');
const { program, Option } = require('commander');
const { WebSocketServer } = require('ws');

const packageInfo = require('./package.json');

program.name(packageInfo.name);
program.version(packageInfo.version);
program.description('Simple protocol router /s');
program.option('-d, --device <serial port path>', 'serialport path');
program.option('-o, --output <output file>', 'file to write console info to');
program.addOption(new Option('-f, --format <output format>').choices(['json']).default('json'));
program.option('--websocket <port>', 'enable websocket server for updates', undefined);
program.parse(process.argv);

const options = program.opts();
if (!options.device) {
  console.error('app: no device specified');
  process.exit(1);
}

let ws;
let updateTimeout;
if (options.websocket) {
  ws = new WebSocketServer({ port: options.websocket });
}

const aasConsole = new Console();
const port = new SerialPort({
  path: options.device,
  baudRate: 76800,
});

function sendToWSClients(payload) {
  if (ws && ws.clients) {
    ws.clients.forEach((socket) => {
      socket.send(JSON.stringify(payload));
    });
  }
}

port.on('error', (error) => {
  console.error('app: problem with serial port');
  console.error(error.message);
});

// Switches the port into "flowing mode"
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
