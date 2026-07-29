#!/usr/bin/env python3
"""Import Banbury irrigation points into turfsheet.course_features + GeoJSON export.

Supports:
  - CSV: name,feature_type,hole_number,lat,lon,source,confidence,notes
  - KML/KMZ: Placemark Point geometries
  - JSON lines or a GeoJSON FeatureCollection
  - Google Maps share URLs (one per line in a .txt)

Safe defaults: source=imported, confidence=medium.
Does not invent coordinates. Skips rows missing lat/lon.

Usage:
  set -a; source ~/.hermes/.env; set +a
  python3 scripts/import_irrigation_features.py path/to/heads.csv
  python3 scripts/import_irrigation_features.py path/to/heads.kml --dry-run
  python3 scripts/import_irrigation_features.py path/to/links.txt --hole 13

Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (schema turfsheet).
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
GEO_OUT = ROOT / "turfsheet-app/public/geo/banbury-irrigation-v1.geojson"

ALLOWED_TYPES = {
    "irrigation_head",
    "valve",
    "drain",
    "other",
}
ALLOWED_SOURCE = {"satellite", "gps", "plan", "manual", "imported", "estimated"}
ALLOWED_CONF = {"high", "medium", "low"}

URL_PATTERNS = [
    re.compile(r"[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)"),
    re.compile(r"@(-?\d+\.\d+),(-?\d+\.\d+)"),
    re.compile(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)"),
]


def load_env() -> None:
    for p in (
        Path.home() / ".hermes/.env",
        ROOT / "turfsheet-app/.env",
        Path.home() / "oldtom-dashboard/.env",
    ):
        if not p.is_file():
            continue
        for line in p.read_text().splitlines():
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            v = v.strip().strip('"').strip("'")
            os.environ.setdefault(k.strip(), v)


def rest(method: str, path: str, body: Any | None = None) -> Any:
    url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1/" + path.lstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    data = None if body is None else json.dumps(body).encode()
    req = Request(
        url,
        data=data,
        method=method,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept-Profile": "turfsheet",
            "Content-Profile": "turfsheet",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urlopen(req, timeout=60) as r:
            raw = r.read()
            return json.loads(raw.decode()) if raw else None
    except HTTPError as e:
        err = e.read().decode(errors="replace")
        raise SystemExit(f"REST {method} {path} failed: {e.code} {err}") from e
    except URLError as e:
        raise SystemExit(f"REST network error: {e}") from e


def parse_lat_lon_from_url(s: str) -> tuple[float, float] | None:
    for pat in URL_PATTERNS:
        m = pat.search(s)
        if not m:
            continue
        a, b = float(m.group(1)), float(m.group(2))
        # q=lat,lon and @lat,lon and !3dlat!4dlon
        if abs(a) <= 90 and abs(b) <= 180:
            return a, b
        if abs(b) <= 90 and abs(a) <= 180:
            return b, a
    return None


def norm_type(t: str | None) -> str:
    t = (t or "irrigation_head").strip().lower().replace(" ", "_")
    aliases = {
        "head": "irrigation_head",
        "sprinkler": "irrigation_head",
        "sprinkler_head": "irrigation_head",
        "irrigation": "irrigation_head",
        "qc": "valve",
        "quick_coupler": "valve",
        "quickcoupler": "valve",
    }
    t = aliases.get(t, t)
    if t not in ALLOWED_TYPES:
        raise ValueError(f"unsupported feature_type: {t}")
    # DB check only allows specific types; map 'other' ok
    return t


def norm_source(s: str | None) -> str:
    s = (s or "imported").strip().lower()
    return s if s in ALLOWED_SOURCE else "imported"


def norm_conf(s: str | None) -> str:
    s = (s or "medium").strip().lower()
    return s if s in ALLOWED_CONF else "medium"


def row(
    name: str,
    lat: float,
    lon: float,
    *,
    feature_type: str = "irrigation_head",
    hole_number: int | None = None,
    source: str = "imported",
    confidence: str = "medium",
    notes: str | None = None,
) -> dict[str, Any]:
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError(f"out of range lat/lon: {lat},{lon}")
    # Banbury rough sanity
    if not (43.66 <= lat <= 43.68 and -116.39 <= lon <= -116.35):
        print(f"WARN: {name} outside Banbury bbox: {lat},{lon}", file=sys.stderr)
    ft = norm_type(feature_type)
    return {
        "name": name.strip() or f"{ft}:{lat:.5f},{lon:.5f}",
        "feature_type": ft if ft != "other" else "other",
        "hole_number": hole_number,
        "centroid_lat": round(lat, 7),
        "centroid_lon": round(lon, 7),
        # Point WKT-ish via PostgREST: use GeoJSON in geometry if RPC exists;
        # REST geometry as GeoJSON needs Accept headers — store centroid first;
        # geometry filled when SQL path available.
        "source": norm_source(source),
        "confidence": norm_conf(confidence),
        "notes": notes,
        "active": True,
        "_lat": lat,
        "_lon": lon,
    }


def parse_csv(path: Path, default_hole: int | None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    with path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, r in enumerate(reader, 1):
            try:
                lat = float(r.get("lat") or r.get("latitude") or "")
                lon = float(r.get("lon") or r.get("lng") or r.get("longitude") or "")
            except ValueError:
                print(f"skip csv row {i}: bad lat/lon", file=sys.stderr)
                continue
            hole = r.get("hole_number") or r.get("hole")
            hole_n = int(hole) if hole not in (None, "") else default_hole
            out.append(
                row(
                    r.get("name") or f"head-{i}",
                    lat,
                    lon,
                    feature_type=r.get("feature_type") or r.get("type") or "irrigation_head",
                    hole_number=hole_n,
                    source=r.get("source") or "imported",
                    confidence=r.get("confidence") or "medium",
                    notes=r.get("notes") or None,
                )
            )
    return out


def parse_geojson(path: Path, default_hole: int | None) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    feats = data["features"] if data.get("type") == "FeatureCollection" else [data]
    out: list[dict[str, Any]] = []
    for i, f in enumerate(feats, 1):
        g = f.get("geometry") or {}
        if g.get("type") != "Point":
            continue
        lon, lat = g["coordinates"][:2]
        p = f.get("properties") or {}
        hole = p.get("hole_number") if p.get("hole_number") is not None else default_hole
        out.append(
            row(
                p.get("name") or f"head-{i}",
                float(lat),
                float(lon),
                feature_type=p.get("feature_type") or "irrigation_head",
                hole_number=int(hole) if hole is not None else None,
                source=p.get("source") or "imported",
                confidence=p.get("confidence") or "medium",
                notes=p.get("notes"),
            )
        )
    return out


def _kml_ns(tag: str) -> str:
    # ElementTree leaves namespaces in tags
    return tag


def parse_kml_bytes(raw: bytes, default_hole: int | None) -> list[dict[str, Any]]:
    root = ET.fromstring(raw)
    out: list[dict[str, Any]] = []
    # Match any namespace
    for pm in root.iter():
        if not pm.tag.endswith("Placemark"):
            continue
        name_el = next((c for c in pm if c.tag.endswith("name")), None)
        name = (name_el.text or "").strip() if name_el is not None else ""
        coord_el = None
        for c in pm.iter():
            if c.tag.endswith("coordinates") and c.text:
                coord_el = c
                break
        if coord_el is None:
            continue
        text = (coord_el.text or "").strip()
        if not text:
            continue
        parts = text.split()
        if not parts:
            continue
        # lon,lat[,alt]
        lon_s, lat_s = parts[0].split(",")[:2]
        lon, lat = float(lon_s), float(lat_s)
        out.append(
            row(
                name or f"kml-{len(out)+1}",
                lat,
                lon,
                hole_number=default_hole,
                source="imported",
                confidence="medium",
            )
        )
    return out


def parse_kml(path: Path, default_hole: int | None) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".kmz":
        with zipfile.ZipFile(path) as zf:
            names = [n for n in zf.namelist() if n.lower().endswith(".kml")]
            if not names:
                raise SystemExit("KMZ has no KML")
            raw = zf.read(names[0])
        return parse_kml_bytes(raw, default_hole)
    return parse_kml_bytes(path.read_bytes(), default_hole)


def parse_links_txt(path: Path, default_hole: int | None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # optional "name | url" or "name,url"
        name = f"link-{i}"
        url = line
        if "|" in line:
            name, url = [x.strip() for x in line.split("|", 1)]
        elif "," in line and "http" in line:
            left, right = line.split(",", 1)
            if "http" in right:
                name, url = left.strip(), right.strip()
        ll = parse_lat_lon_from_url(url)
        if not ll:
            print(f"skip link {i}: no coords in {url[:80]}", file=sys.stderr)
            continue
        lat, lon = ll
        out.append(row(name, lat, lon, hole_number=default_hole, source="imported", confidence="medium", notes=url[:200]))
    return out


def to_geojson_feature(r: dict[str, Any], id_: str | None = None) -> dict[str, Any]:
    return {
        "type": "Feature",
        "id": id_,
        "properties": {
            "name": r["name"],
            "feature_type": r["feature_type"],
            "hole_number": r.get("hole_number"),
            "source": r["source"],
            "confidence": r["confidence"],
            "notes": r.get("notes"),
            "course_feature_id": id_,
        },
        "geometry": {
            "type": "Point",
            "coordinates": [r["_lon"], r["_lat"]],
        },
    }


def write_geojson_export(features: list[dict[str, Any]]) -> None:
    fc = {
        "type": "FeatureCollection",
        "properties": {
            "name": "Banbury irrigation assets",
            "version": "1",
            "course": "Banbury Golf Course",
            "crs": "EPSG:4326",
            "note": "Export from course_features / import script. SoR is DB when live.",
            "updated": __import__("datetime").date.today().isoformat(),
            "feature_count": len(features),
        },
        "features": features,
    }
    GEO_OUT.parent.mkdir(parents=True, exist_ok=True)
    GEO_OUT.write_text(json.dumps(fc, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {GEO_OUT} ({len(features)} features)")


def set_point_geometry_sql(rows: list[tuple[str, float, float]]) -> None:
    """Set PostGIS geometry from centroids via linked SQL file."""
    if not rows:
        return
    # Build one UPDATE…FROM VALUES statement
    values = ",\n".join(
        f"('{fid}'::uuid, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326))"
        for fid, lat, lon in rows
    )
    sql = f"""
SET search_path = turfsheet, public, extensions;
UPDATE turfsheet.course_features AS c
SET geometry = v.geom
FROM (VALUES
{values}
) AS v(id, geom)
WHERE c.id = v.id;
"""
    tmp = ROOT / "scripts/.tmp_set_irrigation_geom.sql"
    tmp.write_text(sql, encoding="utf-8")
    print(f"geometry SQL ready: {tmp} ({len(rows)} rows)")
    print("Apply with: npx supabase db query --linked -f scripts/.tmp_set_irrigation_geom.sql")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("path", type=Path, help="CSV, KML/KMZ, GeoJSON, or links .txt")
    ap.add_argument("--hole", type=int, default=None, help="Default hole_number")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-db", action="store_true", help="Only rewrite local GeoJSON merge")
    ap.add_argument("--replace-geojson", action="store_true", help="Overwrite export with only this import")
    args = ap.parse_args()

    load_env()
    path: Path = args.path
    if not path.is_file():
        raise SystemExit(f"not found: {path}")

    suf = path.suffix.lower()
    if suf == ".csv":
        rows = parse_csv(path, args.hole)
    elif suf in {".kml", ".kmz"}:
        rows = parse_kml(path, args.hole)
    elif suf in {".json", ".geojson"}:
        rows = parse_geojson(path, args.hole)
    elif suf in {".txt", ".md"}:
        rows = parse_links_txt(path, args.hole)
    else:
        raise SystemExit(f"unsupported extension: {suf}")

    print(f"parsed {len(rows)} features from {path}")
    if not rows:
        raise SystemExit("nothing to import")

    if args.dry_run:
        for r in rows[:10]:
            print(json.dumps({k: v for k, v in r.items() if not k.startswith("_")}))
        if len(rows) > 10:
            print(f"... +{len(rows)-10} more")
        return

    inserted: list[dict[str, Any]] = []
    geom_pairs: list[tuple[str, float, float]] = []

    if not args.no_db:
        if "SUPABASE_URL" not in os.environ or "SUPABASE_SERVICE_KEY" not in os.environ:
            raise SystemExit("Missing SUPABASE_URL / SUPABASE_SERVICE_KEY")
        payload = []
        for r in rows:
            payload.append(
                {
                    "name": r["name"],
                    "feature_type": r["feature_type"],
                    "hole_number": r.get("hole_number"),
                    "centroid_lat": r["centroid_lat"],
                    "centroid_lon": r["centroid_lon"],
                    "source": r["source"],
                    "confidence": r["confidence"],
                    "notes": r.get("notes"),
                    "active": True,
                }
            )
        # batch insert
        batch = 50
        for i in range(0, len(payload), batch):
            chunk = payload[i : i + batch]
            res = rest("POST", "course_features", chunk)
            if not isinstance(res, list):
                raise SystemExit(f"unexpected insert response: {res}")
            for j, rec in enumerate(res):
                src = rows[i + j]
                inserted.append(to_geojson_feature(src, rec.get("id")))
                geom_pairs.append((rec["id"], src["_lat"], src["_lon"]))
        print(f"inserted {len(inserted)} rows into course_features")
        set_point_geometry_sql(geom_pairs)
    else:
        inserted = [to_geojson_feature(r) for r in rows]

    # merge or replace local geojson
    existing: list[dict[str, Any]] = []
    if GEO_OUT.is_file() and not args.replace_geojson:
        try:
            prev = json.loads(GEO_OUT.read_text(encoding="utf-8"))
            existing = list(prev.get("features") or [])
        except json.JSONDecodeError:
            existing = []
    # de-dupe by name+coords
    def key(f: dict[str, Any]) -> tuple:
        c = (f.get("geometry") or {}).get("coordinates") or [None, None]
        return (f.get("properties", {}).get("name"), round(float(c[0] or 0), 6), round(float(c[1] or 0), 6))

    merged = {key(f): f for f in existing}
    for f in inserted:
        merged[key(f)] = f
    write_geojson_export(list(merged.values()))


if __name__ == "__main__":
    main()
