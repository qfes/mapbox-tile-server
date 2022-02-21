import { join } from "path";
import { Test } from "tape";
import { spawn } from "child_process";
import { get } from "http";
import * as fs from "fs";

export function testURLAgainstSnap(testContext: Test, url: string, snap: string) {

  const apiThread = spawn("sam", 
    ["local", 
    "start-api", 
    "--parameter-overrides", 
    "tilebucket=\"qfes-mapbox-tiles-test\""]);

  let responseBody = '';
  let responseHeader = get(url, (resp) => {
  const data: any[] = [];
  resp.on('data', (chunk) => data.push(chunk))
  resp.on('end', () => {
            apiThread.kill();
            responseBody = data.concat().toString();
            testContext.deepEqual(
                fs.readFileSync(snap).toString(),
                responseBody);
            testContext.end();
    });
  });
};  
  
export function tileURL(path: string) {
  return join("http://127.0.0.1:3000", path);
}
 
export function snapPath(path: string) {
  return join("./tests/snaps/", "tiledir_json_res.json");
}

export function makeSnap(url: string, snap: string) {
  const apiThread = spawn("sam", 
    ["local", 
    "start-api", 
    "--parameter-overrides", 
    "tilebucket=\"qfes-mapbox-tiles-test\""]);

  let responseBody;
  let responseHeader = get(url, (resp) => {
    const data: any[] = [];
    resp.on('data', (chunk) => data.push(chunk))
    resp.on('end', () => {
            apiThread.kill();
            responseBody = Buffer.from(data.concat());
            fs.writeFileSync(snap, JSON.parse(responseBody).toString());
    });
  });
}
