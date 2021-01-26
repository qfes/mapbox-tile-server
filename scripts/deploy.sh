#!/bin/bash

aws lambda update-function-code --function-name mapbox-tile-server --zip-file fileb://dist/mapbox-tile-server.zip
