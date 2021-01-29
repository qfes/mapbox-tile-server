import { existsSync, createWriteStream, unlinkSync } from "fs";
import { promisify } from "util";
import stream from "stream";
import S3 from "aws-sdk/clients/s3";
import Database, { Database as DbConnection, Statement } from "better-sqlite3";

const pipeline = promisify(stream.pipeline);

const s3 = new S3();
const bucket = process.env.BUCKET ?? "qfes-mapbox-tiles";
const endpoints = process.env.ENDPOINTS ?? "";

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
    const filename = `/tmp/${s3Key}`;

    if (!existsSync(filename)) {
      await downloadTiles(s3Key, filename);
    }

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
    await pipeline(
      s3.getObject({ Bucket: bucket, Key: key }).createReadStream(),
      createWriteStream(filename)
    );
  } catch (err) {
    unlinkSync(filename);
    throw err;
  }

  return filename;
}
