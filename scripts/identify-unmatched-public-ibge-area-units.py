#!/usr/bin/env python3
"""F176: diagnose ONLY two public administrative-unit rows absent from DTB.
Both inputs are originals pinned by earlier SHA receipts, never customer data.
No release authority or bulk municipality export.
"""
import importlib.util
import io
import json
import pathlib
import sys
import zipfile
import hashlib

module=pathlib.Path(__file__).resolve().parent/'compare-pinned-dtb-areas2025.py'
spec=importlib.util.spec_from_file_location('f175',module)
f175=importlib.util.module_from_spec(spec)
spec.loader.exec_module(f175)

def inspect(dtb_csv,area_ods):
 if hashlib.sha256(area_ods).hexdigest()!=f175.AREA_ODS_SHA:
  raise ValueError('F176: official area bytes changed')
 dtb=f175.parse_dtb_csv(dtb_csv)
 with zipfile.ZipFile(io.BytesIO(area_ods)) as z:
  if z.testzip() is not None:raise ValueError('F176: invalid area ZIP CRC')
  area=f175.parse_area_xml(z.read('content.xml'))
 extra=sorted(set(area)-set(dtb))
 if len(extra)!=2 or len(dtb)!=5571 or len(area)!=5573:
  raise ValueError('F176: unexpected edition inventory, no classification permitted')
 return {
  'contractVersion':'seo-f176-area2025-exceptional-public-units-v1',
  'dtbSourceRows':len(dtb),
  'areaSourceRows':len(area),
  'additionalPublicAdministrativeUnits':[
   {'geocode':code,'uf':area[code][0],'name':area[code][1]}
   for code in extra
  ],
  'metadataIsPublicAdministrativeInformation':True,
  'unitLegalClassificationIndependentlyVerified':False,
  'nationalMunicipalityPublicationAuthorized':False,
  'releaseStatus':'HOLD_TERRITORIAL_UNIT_CLASSIFICATION'
 }

if __name__=='__main__':
 try:
  if len(sys.argv)!=3:raise ValueError('F176: two pinned sources required')
  with open(sys.argv[1],'rb') as f:dtb=f.read(1024*1024+1)
  with open(sys.argv[2],'rb') as f:area=f.read(1000001)
  if len(dtb)>1024*1024 or len(area)>1000000:raise ValueError('F176: inputs too large')
  print(json.dumps(inspect(dtb,area),ensure_ascii=False))
 except Exception:
  sys.stderr.write('F176: two public-area exception records could not be classified\n')
  sys.exit(1)
