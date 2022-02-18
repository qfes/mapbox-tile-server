import { TileSource, s3, bucket, metadataJSON, generateTileJSON } from "./tilesource";
import { join } from "path";
import { Stream } from "stream";



export class DirectoryTiles implements TileSource {
  private metadata: metadataJSON;

  private constructor(public readonly id: string, metadata: metadataJSON) {
    this.metadata = metadata;
  }

  public static async canOpen(tileset: string ): Promise<boolean> {
    const s3Key = join(tileset,"metadata.json");
    try {
      const tileMetadata = await s3.headObject({ Bucket: bucket, Key: s3Key } );
      return tileMetadata.$metadata.httpStatusCode === 200;
    } catch (err) {
      return false;
    }
  }

  public static async create(tileset: string) {
    const s3Key = join(tileset, "metadata.json");
    const metadataJSON = await fetchMetadataJSON(s3Key);
    let directoryTiles;
    directoryTiles = new DirectoryTiles(tileset, metadataJSON);

    return directoryTiles;
  }

  public getInfo() {
    return generateTileJSON(this.id, this.metadata);
  }

  public async getTile(z: number, x: number, y: number) {
    const tileKey = join(this.id, z.toString(), x.toString(),`${y}.pbf`)
    
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
  let metadata;
  try {
    const metadataJSON = await s3.getObject({ Bucket: bucket, Key: key});
    if (!metadataJSON.Body) {
      throw("No content returned for s3 object: ${key}")
    }
    metadata = JSON.parse(metadataJSON.Body.read()); // bit loose?
  } catch(err) {
    throw(err)
  }

  return metadata;
}

async function stream2buffer(stream: Stream): Promise<Buffer> {

    return new Promise <Buffer> ((resolve, reject) => {
        
        const _buf = Array <any> ();

        stream.on("data", (chunk) => _buf.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(_buf)));
        stream.on("error", (err) => reject(`error converting stream - ${err}`));

    });
} 
