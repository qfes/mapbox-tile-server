import { Test } from "tape";
const test = require("tape");
import { testURLAgainstSnap, tileURL, snapPath } from "./testutils";

test("tile json for directories can be served", function(t: Test) {
  
  testURLAgainstSnap(t,
    tileURL("bushfire_risk_localities_dir.json"),
    snapPath("tiledir_json_res.json"));
  
});

test("a tile for directories can be served", function(t: Test) {

  testURLAgainstSnap(t,
    tileURL("bushfire_risk_localities_dir/5/29/18.vector.pbf"),
    snapPath("tiledir_tile_res.pbf")
  )

});


