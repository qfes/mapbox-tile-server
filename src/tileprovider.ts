import { MBTiles } from "./mbtiles";
import { DirectoryTiles } from "./directorytiles";
import { TileSource } from "./tilesource";
import { RequestProgress } from "@aws-sdk/client-s3";

const memCache = new Map<string, TileSource>();

export async function open(tileset: string) {
    // get db from memory cache
    if (memCache.has(tileset)) {
      return memCache.get(tileset) as TileSource; 
      // Typechecker thinks this can be undefined,
      // Really it shouldn't be as we just checked it's there with has()
    } 
    let tileSource: TileSource;
    if (await MBTiles.canOpen(tileset)) {
      tileSource = await MBTiles.create(tileset);
    } else if (await DirectoryTiles.canOpen(tileset)) {
      tileSource = await DirectoryTiles.create(tileset);
    } else {
      throw(`Unrecognised tileset format: ${tileset}`)
    }

    memCache.set(tileset, tileSource)
    return tileSource;
  }


export function isNotFound(errorMessage: string) {
  const regex = new RegExp("^Unrecognised\\stileset.*");
  return regex.test(errorMessage);
}
