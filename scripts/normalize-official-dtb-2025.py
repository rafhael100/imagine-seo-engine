#!/usr/bin/env python3
"""F172: normalize a SHA-pinned official IBGE DTB 2025 ODS privately.

No network; input bytes must match earlier F170 TLS receipt. Output CSV stays
private in an ephemeral operator directory; stdout contains counts/digests only.
"""
import csv
import hashlib
import io
import json
import os
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile

EXPECTED_SHA = "d077a0e48c36cf18bcc96268b4a436200c014c6b8522c1a62d894acaf39dad27"
TABLE = "urn:oasis:names:tc:opendocument:xmlns:table:1.0"
TEXT = "urn:oasis:names:tc:opendocument:xmlns:text:1.0"
OFFICE = "urn:oasis:names:tc:opendocument:xmlns:office:1.0"
STATE = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA",
    "16": "AP", "17": "TO", "21": "MA", "22": "PI", "23": "CE",
    "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE",
    "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
    "41": "PR", "42": "SC", "43": "RS", "50": "MS", "51": "MT",
    "52": "GO", "53": "DF"
}
SPECIAL = {"5300108": "brasilia", "2605459": "fernando de noronha"}

def fail():
    raise ValueError("F172: unexpected official municipality workbook structure")

def normalize_city(value):
    return "".join(x for x in unicodedata.normalize("NFD", value.lower())
                   if unicodedata.category(x)!="Mn").strip()

def _cells(row):
    values = []
    for child in row:
        if child.tag not in (f"{{{TABLE}}}table-cell",
                             f"{{{TABLE}}}covered-table-cell"):
            continue
        text = " ".join("".join(p.itertext()) for p in
                        child.findall(f".//{{{TEXT}}}p")).strip()
        if not text:
            text = child.get(f"{{{OFFICE}}}value", "").strip()
        times = int(child.get(f"{{{TABLE}}}number-columns-repeated", "1"))
        if times<1 or times>20000:
            fail()
        values.extend([text] * min(times, max(0, 10-len(values))))
        if len(values)>=10:
            break
    return values

def parse_ods_rows(xml_bytes):
    if len(xml_bytes)>20_000_000:
        fail()
    root=ET.fromstring(xml_bytes)
    tables=root.findall(f".//{{{TABLE}}}table")
    sheets=[t for t in tables if "munic" in
            normalize_city(t.get(f"{{{TABLE}}}name", ""))]
    if len(sheets)!=1:
        fail()
    result=[]
    for row in sheets[0].findall(f".//{{{TABLE}}}table-row"):
        values=_cells(row)
        if len(values)<9 or not re.fullmatch(r"[0-9]{7}",values[7]):
            continue
        code=values[7]
        raw_uf=values[0]
        if re.fullmatch(r"[0-9]{2}\.0",raw_uf):
            raw_uf=raw_uf[:2]
        uf=STATE.get(raw_uf)
        if uf is None and raw_uf in STATE.values():
            uf=raw_uf
        if uf is None or code[:2]!=next((p for p,v in STATE.items() if v==uf),""):
            fail()
        city=values[8].strip()
        if not 2<=len(city)<=120 or any(ord(x)<32 or x in "<>" for x in city):
            fail()
        result.append((code,uf,city))
    return result

def validate_roster(rows,expected_count=5571):
    if len(rows)!=expected_count:
        fail()
    codes=[r[0] for r in rows]
    if len(codes)!=len(set(codes)):
        fail()
    if expected_count==5571:
        if len({s for _,s,_ in rows})!=27:
            fail()
        by_code={code:city for code,_,city in rows}
        for code,name in SPECIAL.items():
            if normalize_city(by_code.get(code,""))!=name:
                fail()
    return sorted(rows,key=lambda x:x[0])

def analyze_zip(zip_file,output_file):
    with open(zip_file,"rb") as f:
        data=f.read(5_000_001)
    if len(data)>5_000_000 or hashlib.sha256(data).hexdigest()!=EXPECTED_SHA:
        raise ValueError("F172: ZIP does not match F170 pinned official SHA")
    with zipfile.ZipFile(io.BytesIO(data)) as outer:
        names=[n for n in outer.namelist()
               if "MUNICIPIOS" in n.upper() and n.lower().endswith(".ods")]
        if len(names)!=1 or len(outer.infolist())>250 or outer.testzip() is not None:
            fail()
        ods_bytes=outer.read(names[0])
    if len(ods_bytes)>10_000_000:
        fail()
    with zipfile.ZipFile(io.BytesIO(ods_bytes)) as ods:
        xml_bytes=ods.read("content.xml")
    rows=validate_roster(parse_ods_rows(xml_bytes))
    fd=os.open(output_file,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    try:
        with os.fdopen(fd,"w",encoding="utf-8",newline="") as f:
            writer=csv.writer(f,delimiter=";",lineterminator="\n")
            writer.writerow(("ibgeCode","state","city"))
            writer.writerows(rows)
    except BaseException:
        try:os.unlink(output_file)
        except OSError:pass
        raise
    with open(output_file,"rb") as f:
        normalized=f.read()
    return {
        "contractVersion":"seo-f172-authenticated-transport-dtb-normalization-v1",
        "sourceSha256":EXPECTED_SHA,
        "edition":"DTB_2025",
        "totalStatisticalLocalities":len(rows),
        "regularMunicipalityCandidates":len(rows)-len(SPECIAL),
        "specialTerritorialCodes":len(SPECIAL),
        "coveredFederativeUnits":len({uf for _,uf,_ in rows}),
        "normalizedCsvSha256":hashlib.sha256(normalized).hexdigest(),
        "officialZipPinnedToPreviousRun":True,
        "independentMunicipalityApiAgreementVerified":False,
        "editorialPublicationAuthorized":False,
        "productionDataExported":False
    }

if __name__=="__main__":
    try:
        if len(sys.argv)!=3:fail()
        print(json.dumps(analyze_zip(sys.argv[1],sys.argv[2]),
                         ensure_ascii=False))
    except Exception:
        # No source file, page path, municipality, archive or exception echoed.
        sys.stderr.write("F172: official DTB workbook normalization refused\n")
        sys.exit(1)
