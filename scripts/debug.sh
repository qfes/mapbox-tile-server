webpack --mode development
sam build
sam local invoke MapboxTileServerFunction --event events/tile_event.json -d 5555
