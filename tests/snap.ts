import { makeSnap, tileURL, snapPath } from "./testutils";

makeSnap(
  tileURL("bushfire_risk_localities_dir/5/29/18.vector.pbf"),
  snapPath("tiledir_tile_res.pbf")
);

makeSnap(
    tileURL("bushfire_risk_localities_dir.json"),
    snapPath("tiledir_json_res.json")
);

makeSnap(
  tileURL("bushfire_risk_localities.json"),
  snapPath("mbtiles_json_res.json")
);

makeSnap(
  tileURL("bushfire_risk_localities/5/29/18.vector.pbf"),
  snapPath("mbtiles_tile_res.pbf")
);

makeSnap(
  tileURL("does_not_exist.json"),
  snapPath("does_not_exist.json")
);

makeSnap(
  tileURL("bushfire_risk_localities/5/29/64.vector.pbf"),
  snapPath("nocontent.json")
);

makeSnap(
  tileURL("bushfire_risk_localities/index.html"),
  snapPath("forbidden.json")
);
