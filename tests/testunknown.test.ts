import { Test } from "tape";
const test = require("tape");
import { testURLAgainstSnap, tileURL, snapPath } from "./testutils";

test("tile json for unkown tileset is a 404 not found", function (t: Test) {
  testURLAgainstSnap(t, tileURL("does_not_exist.json"), snapPath("does_not_exist.json"));
});

test("tile requeset for unknown tile has no content", function (t: Test) {
  testURLAgainstSnap(
    t,
    tileURL("bushfire_risk_localities/5/29/64.vector.pbf"),
    snapPath("nocontent.json")
  );
});

test("bogus api call returns forbidden", function (t: Test) {
  testURLAgainstSnap(t, tileURL("bushfire_risk_localities/index.html"), snapPath("forbidden.json"));
});
