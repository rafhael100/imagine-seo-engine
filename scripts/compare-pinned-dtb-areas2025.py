#!/usr/bin/env python3
"""F175 offline: two SHA-pinned 2025 products from official IBGE GeoFTP.

Compare municipality code/UF/name, never emit names, codes or public URLs.
No network, publications or customer data; caller supplies verified local files.
"""
import csv
import hashlib
import io
import json
import re
import sys
import unicodedata
import zipfile
import xml.etree.ElementTree as ET

DTB_CSV_SHA="039f535dbf413a6cd7c5e09e82168a5e46e28e605ddf54c672b4410111ed3818"
AREA_ODS_SHA="029219bb994d87750fbe7d26c31217152a7e95449ddd2d2f26b504cb32a425f1"
TABLE="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
TEXT="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
OFFICE="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
PREFIX={
 "RO":"11","AC":"12","AM":"13","RR":"14","PA":"15","AP":"16","TO":"17",
 "MA":"21","PI":"22","CE":"23","RN":"24","PB":"25","PE":"26","AL":"27","SE":"28",
 "BA":"29","MG":"31","ES":"32","RJ":"33","SP":"35","PR":"41","SC":"42","RS":"43",
 "MS":"50","MT":"51","GO":"52","DF":"53"
}
SPECIAL={"5300108","2605459"}
def fail():raise ValueError("F175: invalid original 2025 territorial workbook data")

def plain(value):
 return ' '.join(''.join(c for c in unicodedata.normalize("NFD",value.lower())
                         if unicodedata.category(c)!="Mn").replace('’',"'").replace('‘',"'").split())

def extract_row(row):
 values=[]
 for cell in row:
  if cell.tag not in (f"{{{TABLE}}}table-cell",f"{{{TABLE}}}covered-table-cell"):
   continue
  content=' '.join(''.join(p.itertext()) for p in cell.findall(f".//{{{TEXT}}}p")).strip()
  if not content:content=cell.get(f"{{{OFFICE}}}value","").strip()
  repeats=int(cell.get(f"{{{TABLE}}}number-columns-repeated","1"))
  if repeats<1 or repeats>20000:fail()
  values.extend([content]*min(repeats,max(0,6-len(values))))
  if len(values)>=6:break
 return values

def parse_area_xml(xml):
 if len(xml)>15000000:fail()
 root=ET.fromstring(xml)
 tables=[t for t in root.findall(f".//{{{TABLE}}}table")
          if t.get(f"{{{TABLE}}}name")=="AR_BR_MUN_2025"]
 if len(tables)!=1:fail()
 records={}
 header=False
 for row in tables[0].findall(f".//{{{TABLE}}}table-row"):
  v=extract_row(row)
  if not header:
   if len(v)>4 and v[:5]==["CD_UF","NM_UF","NM_UF_SIGLA","CD_MUN","NM_MUN"]:
    header=True
   continue
  if not v or all(not x for x in v):continue
  if len(v)<5 or not re.fullmatch(r"\d{7}",v[3]):
   # Footer/comment rows may be present after the data.
   if len(records)>=5571:continue
   fail()
  uf,code,name=v[2],v[3],v[4]
  if uf not in PREFIX or code[:2]!=PREFIX[uf] or not 2<=len(name)<=120 or code in records:fail()
  records[code]=(uf,name)
 if not header or len(records)!=5571 or len({v[0] for v in records.values()})!=27 or not SPECIAL.issubset(records):
  fail()
 return records

def parse_dtb_csv(data):
 if hashlib.sha256(data).hexdigest()!=DTB_CSV_SHA:fail()
 raw=data.decode("utf-8")
 reader=csv.DictReader(io.StringIO(raw),delimiter=";")
 if reader.fieldnames!=["ibgeCode","state","city"]:fail()
 values={}
 for row in reader:
  if None in row or set(row)!=set(reader.fieldnames):fail()
  code,uf,name=row["ibgeCode"],row["state"],row["city"]
  if not re.fullmatch(r"\d{7}",code) or uf not in PREFIX or code[:2]!=PREFIX[uf] or code in values:fail()
  values[code]=(uf,name)
 if len(values)!=5571 or not SPECIAL.issubset(values):fail()
 return values

def compare(dtb,area):
 left=set(dtb);right=set(area)
 mismatched_uf=sum(dtb[k][0]!=area[k][0] for k in left&right)
 mismatched_names=sum(plain(dtb[k][1])!=plain(area[k][1]) for k in left&right)
 missing=len(left-right);extra=len(right-left)
 consistent=(missing+mismatched_uf+mismatched_names+extra)==0
 return {
  "contractVersion":"seo-f175-two-official-ibge-2025-products-review-v1",
  "officialDtbRows":len(dtb),
  "officialAreaRows":len(area),
  "missingFromArea":missing,
  "unexpectedAreaCodes":extra,
  "ufDisagreements":mismatched_uf,
  "municipalityNameDisagreements":mismatched_names,
  "specialUnitsExpected":2,
  "geocodesStructurallyEquivalent":consistent,
  "separateOfficialProductsCompared":True,
  "independentPublisherVerified":False,
  "currentMunicipalLegalStatusVerified":False,
  "editorialApprovalVerified":False,
  "publicationAuthorized":False,
  "networkPerformed":False,
  "releaseStatus":"HOLD_OFFICIAL_PRODUCT_DISAGREEMENT" if not consistent else
    "HOLD_EXTERNAL_EDITORIAL_AND_OPERATIONAL_REVIEW"
 }

_phase='input'
def main():
 global _phase
 if len(sys.argv)!=3:fail()
 with open(sys.argv[1],"rb") as f:dtb_csv=f.read(1024*1024+1)
 with open(sys.argv[2],"rb") as f:area_ods=f.read(1000001)
 if len(dtb_csv)>1024*1024 or len(area_ods)>1000000:fail()
 if hashlib.sha256(area_ods).hexdigest()!=AREA_ODS_SHA:fail()
 _phase='area_zip'
 with zipfile.ZipFile(io.BytesIO(area_ods)) as z:
  if z.testzip() is not None:fail()
  _phase='area_xml'
  area=parse_area_xml(z.read("content.xml"))
 _phase='dtb_csv'
 dtb=parse_dtb_csv(dtb_csv)
 _phase='comparison'
 result=compare(dtb,area)
 print(json.dumps(result,ensure_ascii=False))
 if not result["geocodesStructurallyEquivalent"]:sys.exit(1)

if __name__=="__main__":
 try:main()
 except Exception:
  sys.stderr.write("F175: original area/DTB comparison refused at "+_phase+"\n")
  sys.exit(2)
