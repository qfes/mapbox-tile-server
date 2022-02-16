import { MBTiles } from "./mbtiles";
import { S3 } from "@aws-sdk/client-s3";

export interface TileSource {
        getInfo(): TileJson;
        getTile(z: number, x: number, y: number): Buffer;
}

export interface TileJson {
  id: string;
  tilejson: string;
  tiles: string[];
  scheme: string;
  minzoom?: number;
  maxzoom?: number;
  bounds?: [number, number, number, number];
  center?: [number, number];
}

export const s3 = new S3({});
export const bucket = process.env.BUCKET ?? "qfes-mapbox-tiles";

class TileProvider {

  private static memCache: Map<string, TileSource>;
  private static instance: TileProvider;

  private constructor() {
    TileProvider.memCache = new Map<string, TileSource>();
  };

  public static getInstance(): TileProvider {
    if (!TileProvider.instance) {
      TileProvider.instance = new TileProvider();
    }

    return TileProvider.instance;
  }

  async open(tileset: string) {
    // get db from memory cache
    if (TileProvider.memCache.has(tileset)) {
      return TileProvider.memCache.get(tileset);
    } 
    var tileSource: TileSource;
    if (await MBTiles.canOpen(tileset)) {
      tileSource = await MBTiles.create(tileset);
    } else if (await DirectoryTiles.canOpen(tileset)) {
      tileSource = await DirectoryTiles.create(tileset);
    } else {
      throw(`Unrecognised tileset format: ${tileset}`)
    }

    TileProvider.memCache.set(tileset, tileSource)
    return tileSource;
  }

}
