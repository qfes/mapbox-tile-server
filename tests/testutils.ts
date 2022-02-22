import { join, extname } from "path";
import { Test } from "tape";
import { spawn } from "child_process";
import { get } from "http";
import * as fs from "fs";

export function testURLAgainstSnap(testContext: Test, url: string, snap: string) {

  const apiThread = spawn("sam", 
    ["local", 
    "start-api", 
    "--parameter-overrides", 
    "tilebucket=\"qfes-mapbox-tiles-test\",endpoints=\"test.tiles.qfesanalytics.com\""]);

  const snapType = extname(snap);
  let responseBody;
  let responseHeader = get(url, (resp) => {
  const data: any[] = [];
  resp.on('data', (chunk) => data.push(chunk))
  resp.on('end', () => {
            apiThread.kill();
            responseBody = Buffer.concat(data);
            testContext.deepEqual(
                fs.readFileSync(snap),
                responseBody);
            testContext.end();
    });
  });
};  
  
export function tileURL(path: string) {
  return join("http://127.0.0.1:3000", path);
}
 
export function snapPath(path: string) {
  return join("./tests/snaps/", path);
}

export function makeSnap(url: string, snap: string) {
  const apiThread = spawn("sam", 
    ["local", 
    "start-api", 
    "--parameter-overrides", 
    "tilebucket=\"qfes-mapbox-tiles-test\""]);
  const snapType = extname(snap);
  let responseBody;
  let responseHeader = get(url, (resp) => {
    const data: any[] = [];
    resp.on('data', (chunk) => data.push(chunk))
    resp.on('end', () => {
            apiThread.kill();
            responseBody = Buffer.concat(data);
            fs.writeFileSync(snap, snapType === ".json"? responseBody.toString(): responseBody);
            //if it's not .json it's likely .pbf, so don't toString binary.
    });
  });
}
