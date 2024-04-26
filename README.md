## Explorations in interacting with an [All American Scoreboards 8000](https://www.allamericanscoreboards.com/8000-series/)

### Supported Scoreboards
- basketball (no stats)
- volleyball
- football (no stats)
- baseball
- wrestling
- auto racing
- soccer
- hockey
- track
- whirley

## Build
- clone/download repo
- in repo run `npm install && npm run build:cli`
- find binary in `packages/cli/dist/`

## Usage
```
Usage: aas-cli [options]

AAS Serial Decoder

Options:
  -V, --version                    output the version number
  -d, --device <serial port path>  serialport path
  -o, --output <output file>       file to write console info to
  -f, --format <output format>      (choices: "json", "xml", "yaml", default: "json")
  --websocket <port>               enable websocket server for updates
  -h, --help                       display help for command
```
If a device isn't supplied with the `-d/--device` flag then you will be prompted to select one.
