import { forbidden, noContent, ok } from "./response";
import { MBTiles } from "./mbtiles";
import { Router } from "./router";
const router = new Router();

/**
 * Response headers middleware
 */
router.use((response) => {
  const isOk = response.statusCode >= 200 && response.statusCode < 300;

  return {
    ...response,
    headers: {
      ...response.headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Method": "GET",
      ...(isOk && { "Cache-Control": "max-age=43200, s-maxage=300" }),
    },
  };
});

/**
 * Handle tilejson metadata requests
 */
router.get("/:tileset.json", async ({ tileset }) => {
  try {
    const mbtiles = await MBTiles.open(tileset);
    const info = mbtiles.getInfo();
    return ok(info);
  } catch {
    return forbidden();
  }
});

/**
 * Handle tile requests
 */
router.get("/:tileset/:z/:x/:y.vector.pbf", async ({ tileset, z, x, y }) => {
  try {
    const mbtiles = await MBTiles.open(tileset);
    const tile = mbtiles.getTile(Number(z), Number(x), Number(y));

    return tile != null ? ok(tile) : noContent();
  } catch {
    return forbidden();
  }
});

export const handler = router.handler;
