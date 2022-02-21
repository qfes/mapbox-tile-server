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

## Build

```
npm run build
sudo -E sam build
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

`debugger;` statements can be placed in typescript code and compiled to JS. The SAM build needs to be called as well:

```
npm run build:dev
sudo -E sam build
```

Test an event with a debugger listening on port 5555:

```
sam local invoke MapboxTileServerFunction --event events/tile_event.json -d 5555
```

Attach the VSCode debugger by running the debug config for `"Attach to SAM CLI"`.

You can also run an event and attach debugger in one with the debug configs:

  * `"Debug Mapbox Tile Server json request"`
  * `"Debug Mapbox Tile Server vector tile request"`

## Automated Tests

Are written in Typescript, and use the Tape testing framework. `ts-node` is required to run the tests.

## Deploying to AWS

TODO
