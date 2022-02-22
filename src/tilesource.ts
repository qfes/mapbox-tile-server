import { S3 } from "@aws-sdk/client-s3";
const endpoints = process.env.ENDPOINTS ?? "";
export const bucket = process.env.BUCKET ?? "qfes-mapbox-tiles";

export interface TileSource {
  getInfo(): TileJson;
  getTile(z: number, x: number, y: number): Promise<Buffer | null>;
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

export interface metadataJSON {
  name: string;
  description: string;
  version: string;
  minzoom: string;
  maxzoom: string;
  center: string;
  bounds: string;
  format: string;
  json: string;
}

export const s3 = new S3({});

export function generateTileJSON(id: string, metadata: metadataJSON) {
  const info: Record<string, any> = {};
  for (const [name, value] of Object.entries(metadata)) {
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
    id: id,
    tilejson: "2.2.0",
    scheme: "xyz",
    tiles: endpoints
      .split(",")
      .map((endpoint) => `https://${endpoint}/${id}/{z}/{x}/{y}.vector.pbf`),
  };
}
