## Development environment

The target environment on AWS is `nodejs12.x` on `linux x64`. The build environment must be compatible with the target environment. Ubuntu 20.04 on WSL2 with nodejs12.x is compatible.

`AWS CLI v2` is also required for deploying the built lambda package to aws. This utility is called via
`npm run deploy`.

### Installing node dependencies

Node dependencies are managed via npm. Node bindings should be compiled after install.

```bash
npm install
```

### Building distribution package

Source build and bundle is handled via typescript and webpack. The build scripts build the source typescript and bundle any dependencies in `./dist/index.js`. Unused code isn't bundled.

Node bindings are written to `./dist/[binding-name].[ext]`.

For development builds, source-maps are written to `./dist/index.js.map`.

```bash
npm run build
# or dev environment
# npm run build:dev
```

### Deploy built function to AWS

Deployment requires the AWS CLI v2 and sufficient credentials to update lambda functions. See [aws_credentials](https://github.com/qfes/aws_credentials).

```bash
npm run deploy
```
