webpack --mode development
sam build
sam local invoke MapboxTileServerFunction --event events/tile_event_dir.json -d 5555 --parameter-overrides 'tilebucket="qfes-mapbox-tiles-test"'
