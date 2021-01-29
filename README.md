# mapbox-tile-server

Defines a simple AWS lambda service for mapbox serving vector tiles from mbtiles databases on S3. This server doesn't support raster tiles, nor _very large_ databases.

On first request for a given mbtiles database for a given lambda invocation, the mbtiles database is copied to `/tmp/` on the lambda instance. This storage location is limited to 512 MB. The full QLD isochrone mbtiles database is ~30 MB in size, so this limitation shouldn't be an issue for QLD specific databases.

## Usage

Upload a _vector_ .mbtiles database to `env.BUCKET`, then request tiles and tilejson from the API gateway. Example:

```bash
export BUCKET=qfes-mapbox-tiles
export ENDPOINT=https://o7mvb95v3d.execute-api.ap-southeast-2.amazonaws.com

# upload
aws s3 cp ./isochrone.mbtiles s3://$BUCKET/isochrone.mbtiles

# tilejson
curl $ENDPOINT/isochrone.json

# tiles $ENDPOINT/{z}/{x}/{y}.vector.pbf
curl $ENDPOINT/isochrone/1/1/1.vector.pbf
```
