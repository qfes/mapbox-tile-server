#!/bin/bash
sam deploy --guided --stack-name "mapbox-tile-server" --parameter-overrides 'endpoints="a.tiles.qfesanalytics.com,tiles.qfesanalytics.com",domainname="tiles.qfesanalytics.com",bucket="qfes-mapbox-tiles"'
