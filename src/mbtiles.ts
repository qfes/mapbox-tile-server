import { unlinkSync, statSync, writeFile, readdirSync } from "fs";
import { promisify } from "util";
import stream from "stream";
import { S3, S3Client } from "@aws-sdk/client-s3";
import {join} from "path";
import Database, { Database as DbConnection, Statement } from "better-sqlite3";

const pipeline = promisify(stream.pipeline);

const s3 = new S3({});
const bucket = process.env.BUCKET ?? "qfes-mapbox-tiles";
const endpoints = process.env.ENDPOINTS ?? "";
const TMP_DISK_SIZE_MB = 500 // 500mb limit
const TMP_DISK_PATH = "/tmp"

const GET_INFO = "SELECT * FROM metadata";
const GET_TILE =
  "SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?";

const memCache = new Map<string, MBTiles>();

export class MBTiles {
  private readonly _db: DbConnection;
  private readonly _tileStmt: Statement;

  /**
   * Construct an mbtiles instance
   * @param filename database filename
   */
  constructor(public readonly id: string, filename: string) {
    this._db = Database(filename, { readonly: true, fileMustExist: true });
    this._tileStmt = this._db.prepare(GET_TILE).raw().pluck();
  }

  /**
   * Get mbtiles metadata
   */
  getInfo() {
    const stmt = this._db.prepare(GET_INFO);
    const rows = stmt.all();

    const info: Record<string, any> = {};
    for (const { name, value } of rows) {
      switch (name) {
        case "json":
          const json = JSON.parse(value);
          Object.assign(info, json);
          break;
        case "minzoom":
        case "maxzoom":
          info[name] = parseInt(value, 10);
          break;
        case "center":
        case "bounds":
          info[name] = value.split(",").map(parseFloat);
          break;
        default:
          info[name] = value;
          break;
      }
    }

    return {
      ...info,
      id: this.id,
      tilejson: "2.2.0",
      scheme: "xyz",
      tiles: endpoints.split(",").map((endpoint) => `https://${endpoint}/${this.id}/{z}/{x}/{y}.vector.pbf`),
    };
  }

  /**
   * Get a tile
   *
   * @param z tile z coordinate
   * @param x tile x coordinate
   * @param y tile y coordinate
   */
  getTile(z: number, x: number, y: number) {
    // flip y coordinate
    y = (1 << z) - 1 - y;
    const tile = this._tileStmt.get(z, x, y);

    if (tile != null && !Buffer.isBuffer(tile)) {
      throw new Error("Tile is invalid");
    }
    return tile;
  }

  /**
   * Open an mbtiles database
   * @param tileset the name of the tileset
   */
  static async open(tileset: string) {
    // get db from memory cache
    if (memCache.has(tileset)) {
      return memCache.get(tileset)!;
    }

    const s3Key = `${tileset}.mbtiles`;

    const filename = await stashTiles(s3Key);

    const mbtiles = new MBTiles(tileset, filename);
    memCache.set(tileset, mbtiles);
    return mbtiles;
  }
}

/**
 * Download mbtiles from s3
 *
 * @param key the s3 key
 * @param filename the target filename
 */
async function downloadTiles(key: string, filename: string) {
  try {
    const tileData = await s3.getObject({ Bucket: bucket, Key: key })
    writeFile(filename, tileData.Body, 
      (err) => {
        throw(`an error occurred writing ${key}.`)
    });
  } catch (err) {
    unlinkSync(filename);
    throw err;
  }

  return filename;
}

// Get size of object
// Get size of tmp
// If object exceeds volumne of tmp error
// If object fits in free space of tmp all good
/**
 * Check the size of tiles from s3 and rotate the temp storage if necessary before downloading.
 *
 * @param key the s3 key
 **/
async function stashTiles(key: string): Promise<string> {

  const filename = join(TMP_DISK_PATH, key);
  try {
    const headObjectReq = await s3.headObject({ Bucket: bucket, Key: key });
    const tileFileSizeMB = 
      headObjectReq.ContentLength? headObjectReq.ContentLength * 1024 * 1024 : 0;
    if (tileFileSizeMB > TMP_DISK_SIZE_MB) {
      throw(`mbtiles file exceeded maximum size: ${tileFileSizeMB} > ${TMP_DISK_SIZE_MB}`);
    }

    // an array of files in temp sorted by least recently accessed
    const tmpFiles = readdirSync(TMP_DISK_PATH).
      map((file) => { 
        const fileStats = statSync(file);
        return { filename: file, size: fileStats.size, accessed: fileStats.atime }
      }).
      sort((file1, file2) => (file1.accessed < file2.accessed)? -1 : 1)
  
    const consumedTemp = 
      tmpFiles.
      reduce((total, file) => total + file.size, 0)
    
    if (consumedTemp + tileFileSizeMB > TMP_DISK_SIZE_MB) {
      // We need to make space for the incoming tiles
      const needToFree = (consumedTemp + tileFileSizeMB) - TMP_DISK_SIZE_MB;
      tmpFiles.
        reduce((targetToFree, file) => {
          if (targetToFree <= 0) {
            //do nothing
            return targetToFree
          }
          // free some space
            unlinkSync(file.filename);
            return targetToFree - file.size;
          },
          needToFree)
    }
    // guaranteed to be enough space for the new tiles
    downloadTiles(key, filename)
  } catch (err) {
    debugger;
    throw err;
  }

  return filename;
}
