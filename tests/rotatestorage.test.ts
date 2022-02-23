import { Test } from "tape";
const test = require("tape");
import {
  writeFileSync,
  mkdirSync,
  unlinkSync,
  writeFile,
  readdirSync,
  rmdirSync,
  existsSync,
  symlinkSync,
} from "fs";
import { rotateTempStorage } from "../src/mbtiles";
import { join } from "path";

test("test that files can be rotated in temp storage", function (t: Test) {
  const file1Data = Buffer.alloc(1000, 1);
  const file2Data = Buffer.alloc(1000, 2);
  const storage_dir = "./test_storage";

  if (existsSync(storage_dir)) rmdirSync(storage_dir, { recursive: true });
  mkdirSync(storage_dir);
  writeFileSync(join(storage_dir, "file1"), file1Data);
  writeFileSync(join(storage_dir, "file2"), file2Data);

  rotateTempStorage(1000 / (1024 * 1024), storage_dir, 2500 / (1024 * 1024));

  const remainingFiles = readdirSync(storage_dir);
  rmdirSync(storage_dir, { recursive: true });
  t.deepEquals(remainingFiles, ["file2"]);
  t.end();
});
