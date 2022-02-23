import { TileSource, s3, bucket, metadataJSON, generateTileJSON } from "./tilesource";
import { join } from "path";
import { Stream } from "stream";

export class DirectoryTiles implements TileSource {
  private metadata: metadataJSON;

  private constructor(public readonly id: string, metadata: metadataJSON) {
    this.metadata = metadata;
  }

  public static async canOpen(tileset: string): Promise<boolean> {
    const s3Key = join(tileset, "metadata.json");
    try {
      debugger;
      const tileMetadata = await s3.headObject({ Bucket: bucket, Key: s3Key });
      return tileMetadata.$metadata.httpStatusCode === 200;
    } catch (err) {
      return false;
    }
  }

  public static async create(tileset: string) {
    debugger;
    const s3Key = join(tileset, "metadata.json");
    let directoryTiles;
    try {
      const metadataJSON = await fetchMetadataJSON(s3Key);
      directoryTiles = new DirectoryTiles(tileset, metadataJSON);
    } catch(err) {
      console.log(err);
      throw err;
    }

    return directoryTiles;
  }

  public getInfo() {
    return generateTileJSON(this.id, this.metadata);
  }

  public async getTile(z: number, x: number, y: number) {
    const tileKey = join(this.id, z.toString(), x.toString(), `${y}.pbf`);

    let tile: Buffer | null;
    try {
      debugger;
      const tileData = await s3.getObject({ Bucket: bucket, Key: tileKey });
      const tiles = await stream2buffer(tileData.Body);
      return tiles;
    } catch {
      tile = null;
      return tile;
    }
  }
}

async function fetchMetadataJSON(key: string) {
  let metadataJSON;
  try {
    const metadata = await s3.getObject({ Bucket: bucket, Key: key });
    if (!metadata.Body) {
      throw "No content returned for s3 object: ${key}";
    }
    const metadataBody = await stream2buffer(metadata.Body);
    metadataJSON = JSON.parse(metadataBody.toString());
    debugger;
  } catch (err) {
    throw err;
  }

  return metadataJSON;
}

async function stream2buffer(stream: Stream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>();

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(`error converting stream - ${err}`));
  });
}
