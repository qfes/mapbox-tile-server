import { unlinkSync, statSync, readdirSync, createWriteStream, fstat, existsSync } from "fs";
import stream, { Readable } from "stream";
import { promisify } from "util";
import { join } from "path";
import Database, { Database as DbConnection, Statement } from "better-sqlite3";
import { debug } from "console";
import { s3, bucket, TileSource, generateTileJSON } from "./tilesource";

const pipeline = promisify(stream.pipeline);

const TMP_DISK_SIZE_MB = 500; // 500mb limit
const TMP_DISK_PATH = "/tmp";

const GET_INFO = "SELECT * FROM metadata";
const GET_TILE =
  "SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?";

export class MBTiles implements TileSource {
  private _db: DbConnection;
  private _tileStmt: Statement;

  /**
   * Construct an mbtiles instance
   * @param filename database filename
   */
  private constructor(public readonly id: string, filename: string) {
    this._db = Database(filename, { readonly: true, fileMustExist: true });
    this._tileStmt = this._db.prepare(GET_TILE).raw().pluck();
  }

  /**
   * create an MBTiles object
   * @param tileset the name of the tileset
   */
  static async create(tileset: string) {
    const s3Key = `${tileset}.mbtiles`;
    const filename = await downloadTiles(s3Key);
    let mbtiles;
    try {
      mbtiles = new MBTiles(tileset, filename);
    } catch (err) {
      console.log(err);
      throw err;
    }
    return mbtiles;
  }

  /**
   * Get mbtiles metadata
   */
  getInfo() {
    const stmt = this._db.prepare(GET_INFO);
    const rows = stmt.all();
    const metadataObject = Object.assign({}, ...rows);

    return generateTileJSON(this.id, metadataObject);
  }

  /**
   * Get a tile
   *
   * @param z tile z coordinate
   * @param x tile x coordinate
   * @param y tile y coordinate
   */
  async getTile(z: number, x: number, y: number) {
    // flip y coordinate
    y = (1 << z) - 1 - y;
    const tile = this._tileStmt.get(z, x, y);

    if (tile != null && !Buffer.isBuffer(tile)) {
      throw new Error("Tile is invalid");
    }
    return tile;
  }

  public static async canOpen(tileset: string): Promise<boolean> {
    const s3Key = `${tileset}.mbtiles`;
    try {
      const tileMetadata = await s3.headObject({ Bucket: bucket, Key: s3Key });
      return tileMetadata.$metadata.httpStatusCode === 200;
    } catch {
      return false;
    }
  }
}

/**
 * Download mbtiles from s3
 *
 * @param key the s3 key
 * @param filename the target filename
 */
async function downloadTiles(key: string) {
  const filename = join(TMP_DISK_PATH, key);
  try {
    const tileData = await s3.getObject({ Bucket: bucket, Key: key });

    const tileFileSizeMB = tileData.ContentLength ? tileData.ContentLength / (1024 * 1024) : 0;
    if (tileFileSizeMB > TMP_DISK_SIZE_MB) {
      throw `mbtiles file exceeded maximum size: ${tileFileSizeMB} > ${TMP_DISK_SIZE_MB}`;
    }
    // make space for .mbtiles if possible/needed
    await rotateTempStorage(tileFileSizeMB);

    // write the file
    await pipeline(tileData.Body as Readable, createWriteStream(filename));
  } catch (err) {
    console.log(err);
    throw err;
  }

  return filename;
}

/**
 * Make space in temporary storage for incomming .mbtiles
 *
 * Removing existing files in order of least most recently accessed.
 *
 * @param incommingFileSizeMB the file size in MB that needs to be free on temp storage.
 */
export async function rotateTempStorage(
  incommingFileSizeMB: number,
  storageLocation: string = TMP_DISK_PATH,
  storageSize: number = TMP_DISK_SIZE_MB
) {
  try {
    // an array of files in temp sorted by least recently accessed
    const tmpFiles = readdirSync(storageLocation)
      .map((file) => {
        const filePath = join(storageLocation, file);
        const fileStats = statSync(filePath);
        return { filename: filePath, sizeMB: fileStats.size / (1024 * 1024), accessed: fileStats.atime };
      })
      .sort((file1, file2) => (file1.accessed < file2.accessed ? -1 : 1));

    const consumedTemp = tmpFiles.reduce((total, file) => total + file.sizeMB, 0);

    if (consumedTemp + incommingFileSizeMB > storageSize) {
      // We need to make space for the incoming tiles
      const needToFree = consumedTemp + incommingFileSizeMB - storageSize;
      tmpFiles.reduce((targetToFree, file) => {
        if (targetToFree <= 0) {
          // do nothing
          return targetToFree;
        }
        // free some space
        unlinkSync(file.filename);
        return targetToFree - file.sizeMB;
      }, needToFree);
    }
  } catch (err) {
    throw "Error rotating .mbtiles files in temp storage.";
  }
}
