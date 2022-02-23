import { forbidden, noContent, ok, notFound } from "./response";
import { Router } from "./router";
import * as TileProvider from "./tileprovider";
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
    const tiles = await TileProvider.open(tileset);
    const info = tiles.getInfo();
    return ok(info);
  } catch (err) {
    if (typeof err === "string" && TileProvider.isNotFound(err)) {
      return notFound();
    }
    console.log(err);
    return forbidden();
  }
});

/**
 * Handle tile requests
 */
router.get("/:tileset/:z/:x/:y.vector.pbf", async ({ tileset, z, x, y }) => {
  try {
    const tiles = await TileProvider.open(tileset);
    const tile = await tiles.getTile(Number(z), Number(x), Number(y));

    return tile != null ? ok(tile) : noContent();
  } catch (err) {
    console.log(err);
    return forbidden();
  }
});

export const handler = router.handler;
