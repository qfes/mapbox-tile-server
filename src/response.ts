import type { Response } from "aws-lambda";

export function ok(data: object | Buffer) {
  return data instanceof Buffer ? vectorTile(data) : json(data);
}

export function noContent(): Response {
  return { statusCode: 204 };
}

export function notFound(content: object = { message: "Not found" }): Response {
  return json(content, 404);
}

export function forbidden(content: object = { message: "Forbidden" }): Response {
  return json(content, 403);
}

export function json(content: object, statusCode = 200) {
  return {
    statusCode,
    body: JSON.stringify(content),
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  };
}

export function vectorTile(data: Buffer): Response {
  return {
    statusCode: 200,
    body: data.toString("base64"),
    isBase64Encoded: true,
    headers: {
      "Content-Type": "application/x-protobuf",
      "Content-Encoding": "gzip",
    },
  };
}
