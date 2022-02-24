## Get the SAM CLI if you don't have it

```
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
```

## Development environment

The target environment on AWS is `nodejs14.x` on `linux x64`. The build environment must be compatible with the target environment. Ubuntu 20.04 on WSL2 with nodejs14.x is compatible.

### Installing node dependencies

Node dependencies are managed via npm. Node bindings should be compiled after install.

```bash
npm install
```

Running the tests or playing with code in a REPL uses the `ts-node` package

```
sudo -E npm install -g ts-node
```

## Build

```
sudo -E npm run build
```

### Testing

Once the config is built, events can be passed to the function using the `sam invoke` interface:

#### Test a tile request
```
sam local invoke MapboxTileServerFunction --event events/tile_event.json
```

#### Test a tile json request

```
sam local invoke MapboxTileServerFunction --event events/tile_event.json
```

#### Test interactively

You can start a server you can fire custom requests to via curl or a browser with:

```
sam local start-api
```

### Debugging

`debugger;` statements can be placed in typescript code and compiled to JS.


Test an event with a debugger listening on port 5555:

```
sudo -E npm run debug
```

Which invokes `~/scripts/debug.sh` and contains the line:

```
sam local invoke MapboxTileServerFunction --event events/tile_json_event_dir.json -d 5555 --parameter-overrides 'tilebucket="qfes-mapbox-tiles-test"'
```

change the `--event` argument to another .json file to interactively debug a different event type.

Once debug has been launched, attach the VSCode debugger by running the debug config for `"Attach to SAM CLI"`.

## Automated Tests

Are written in Typescript, and use the Tape testing framework. A global install of `ts-node` is required to run the tests.

To build config and Run tests:

```
sudo -E npm run test
```

## Deploying to AWS

deploy a test instance 

```
sudo -E npm run deploy:test
```

deploy the prod instance

```
sudo -E npm run deploy
```

These use the sam deploy --guided option to step you through configuration.

The check the domain name is tne one you want and answer yes to this question: 

```
  MapboxTileServerFunction may not have authorization defined, Is this okay? [y/N]: Y
```

Since our function doesn't have any authorisation mechanism (e.g. tokens), it's an open API endpoint.
