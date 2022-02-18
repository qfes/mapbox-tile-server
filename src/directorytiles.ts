import { TileSource, s3, bucket, metadataJSON, generateTileJSON } from "./tilesource";
import { join } from "path";



export class DirectoryTiles implements TileSource {
  private metadata: metadataJSON;

  private constructor(public readonly id: string, metadata: metadataJSON) {
    this.metadata = metadata;
  }

  public static async canOpen(tileset: string ): Promise<boolean> {
    const s3Key = `${tileset}/metadata.json`;
    try {
      const tileMetadata = await s3.headObject({ Bucket: bucket, Key: s3Key } );
      return tileMetadata.$metadata.httpStatusCode === 200;
    } catch {
      return false;
    }
  }

  public static async create(tileset: string) {
    const s3Key = `${tileset}/metadata.json`;
    const metadataJSON = await fetchMetadataJSON(s3Key);
    let directoryTiles;
    directoryTiles = new DirectoryTiles(tileset, metadataJSON);

    return directoryTiles;
  }

  public getInfo() {
    return generateTileJSON(this.id, this.metadata);
  }

  public async getTile(z: number, x: number, y: number) {
    // flip y coordinate
    y = (1 << z) - 1 - y;
    const tileKey = join(this.id, z.toString(), x.toString(),`${y}.pbf`)
    
    let tile: Buffer | null;
    try {
      const tileData = await s3.getObject({ Bucket: bucket, Key: tileKey });
      tile = tileData.Body.read();
      return tile;
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
    metadata = JSON.parse(metadataJSON.Body.read());
  } catch(err) {
    throw(err)
  }

  return metadata;
}
