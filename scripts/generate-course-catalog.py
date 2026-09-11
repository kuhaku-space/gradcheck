#!/usr/bin/env python3
"""Generate the compact 2026 external-course catalog from Osaka University XLSX files."""

from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def read_courses(path: Path) -> dict[str, float]:
    result: dict[str, float] = {}
    with zipfile.ZipFile(path) as archive:
        shared = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        strings = [
            "".join(node.text or "" for node in item.findall(".//m:t", NS))
            for item in shared.findall("m:si", NS)
        ]
        sheets = sorted(
            name
            for name in archive.namelist()
            if name.startswith("xl/worksheets/sheet") and name.endswith(".xml")
        )
        for sheet in sheets:
            root = ET.fromstring(archive.read(sheet))
            for row in root.findall(".//m:row", NS):
                cells: dict[str, str] = {}
                for cell in row.findall("m:c", NS):
                    match = re.match(r"[A-Z]+", cell.get("r", ""))
                    value = cell.find("m:v", NS)
                    if not match or value is None:
                        continue
                    cells[match.group()] = (
                        strings[int(value.text)]
                        if cell.get("t") == "s"
                        else value.text or ""
                    )
                code = cells.get("B", "").strip()
                credits = cells.get("D", "").strip()
                if re.fullmatch(r"[0-9A-Z]{6}", code) and re.fullmatch(
                    r"\d+(?:\.\d+)?", credits
                ):
                    result[code] = float(credits)
    return result


def number(value: float) -> str:
    return str(int(value)) if value.is_integer() else str(value)


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: generate-course-catalog.py KYoyo.xlsx Kokusai.xlsx OUTPUT.ts")
    categories = [
        (Path(sys.argv[1]), "kodo-kyoyo"),
        (Path(sys.argv[2]), "kokusai"),
    ]
    rows: dict[str, tuple[float, str]] = {}
    for path, category in categories:
        for code, credits in read_courses(path).items():
            if code in rows:
                raise ValueError(f"duplicate course code across categories: {code}")
            rows[code] = (credits, category)

    lines = [
        "// Generated from the official 2026 CS advanced liberal arts/global literacy lists.",
        "// Run scripts/generate-course-catalog.py to update; do not edit manually.",
        "import type { Category } from './types'",
        "",
        "export const EXTERNAL_COURSE_CATALOG: Record<string, readonly [number, Category]> = {",
    ]
    lines.extend(
        f"  '{code}': [{number(credits)}, '{category}'],"
        for code, (credits, category) in sorted(rows.items())
    )
    lines.extend(["}", ""])
    Path(sys.argv[3]).write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
