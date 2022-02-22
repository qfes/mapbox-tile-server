import { Test } from "tape";
const test = require("tape");
import { testURLAgainstSnap, tileURL, snapPath } from "./testutils";

test("tile json for mbtiles can be served", function (t: Test) {
  testURLAgainstSnap(
    t,
    tileURL("bushfire_risk_localities.json"),
    snapPath("mbtiles_json_res.json")
  );
});

test("a tile for directories can be served", function (t: Test) {
  testURLAgainstSnap(
    t,
    tileURL("bushfire_risk_localities/5/29/18.vector.pbf"),
    snapPath("mbtiles_tile_res.pbf")
  );
});
