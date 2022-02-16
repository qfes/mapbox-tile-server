import { TileSource } from "./tilesource";

export class DirectoryTiles implements TileSource {

  public static async canOpen(tileset:string ): Promise<boolean> {
    const s3Key = `${tileset}/metadata.json`;
    try {
      const tileMetadata = await s3.headObject({ Bucket: bucket, Key: s3Key } );
      return tileMetadata.$metadata.httpStatusCode === 200;
    } catch {
      return false;
    }
  }

}
