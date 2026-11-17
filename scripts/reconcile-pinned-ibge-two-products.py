#!/usr/bin/env python3
"""F177: strictly exclude two named non-municipal IBGE 2025 operational areas.

Use separately SHA-pinned DTB and Area products; never silently discard codes.
No live HTTP, customer records, bulk export, or publishing.
"""
import hashlib
import importlib.util
import io
import json
import pathlib
import re
import sys
import unicodedata
import zipfile

src=pathlib.Path(__file__).resolve().parent/'compare-pinned-dtb-areas2025.py'
spec=importlib.util.spec_from_file_location('f175',src)
f175=importlib.util.module_from_spec(spec)
spec.loader.exec_module(f175)

EXPECTED_EXTRA={
 '4300001':('RS','area operacional lagoa mirim'),
 '4300002':('RS','area operacional lagoa dos patos')
}
def normalize(s):
 return ' '.join(re.sub(r'[^a-z0-9]+',' ',''.join(
  x for x in unicodedata.normalize('NFD',s.lower())
  if unicodedata.category(x)!='Mn')).split())

def reconcile(dtb,area,expected_rows=5571):
 if not isinstance(dtb,dict) or not isinstance(area,dict):
  raise ValueError('F177: valid source maps required')
 if len(dtb)!=expected_rows or len(area)!=expected_rows+2:
  raise ValueError('F177: unexpected geographic inventory size')
 extra=set(area)-set(dtb)
 if extra!=set(EXPECTED_EXTRA):
  raise ValueError('F177: unknown non-municipal territorial codes')
 for code,(uf,label) in EXPECTED_EXTRA.items():
  actual=area.get(code)
  if not actual or actual[0]!=uf or normalize(actual[1])!=label:
   raise ValueError('F177: area operational-unit identity mismatch')
 filtered={k:v for k,v in area.items() if k not in EXPECTED_EXTRA}
 review=f175.compare(dtb,filtered)
 passed=review['geocodesStructurallyEquivalent']
 return {
  'contractVersion':'seo-f177-national-geocodes-excluding-two-operational-areas-v1',
  'dtbMunicipalStatisticalRows':len(dtb),
  'areaProductRows':len(area),
  'publicOperationalAreaExclusions':2,
  'verifiedNonMunicipalLabels':True,
  'reconciledStatisticalRows':len(filtered),
  'unmatchedStatisticalCodes':review['missingFromArea']+review['unexpectedAreaCodes'],
  'ufDisagreements':review['ufDisagreements'],
  'municipalityNameDisagreements':review['municipalityNameDisagreements'],
  'crossProductRecordsConsistent':passed,
  'independentAuthorityAuthenticated':False,
  'legalMunicipalityClassificationIndependentlyApproved':False,
  'automaticMunicipalPagesAuthorized':False,
  'indexingAuthorized':False,
  'networkPerformed':False,
  'releaseStatus':'HOLD_INDEPENDENT_EDITORIAL_AND_OPERATIONAL_REVIEW' if passed else
    'HOLD_CROSS_PRODUCT_MUNICIPALITY_DISAGREEMENT'
 }

def run(dtb_csv,area_ods):
 if hashlib.sha256(dtb_csv).hexdigest()!=f175.DTB_CSV_SHA or \
    hashlib.sha256(area_ods).hexdigest()!=f175.AREA_ODS_SHA:
  raise ValueError('F177: original source checksum mismatch')
 dtb=f175.parse_dtb_csv(dtb_csv)
 with zipfile.ZipFile(io.BytesIO(area_ods)) as z:
  if z.testzip() is not None:raise ValueError('F177: invalid original ODS CRC')
  area=f175.parse_area_xml(z.read('content.xml'))
 return reconcile(dtb,area)

if __name__=='__main__':
 try:
  if len(sys.argv)!=3:raise ValueError('F177: two pinned private inputs required')
  with open(sys.argv[1],'rb') as f:dtb=f.read(1024*1024+1)
  with open(sys.argv[2],'rb') as f:area=f.read(1000001)
  if len(dtb)>1024*1024 or len(area)>1000000:
   raise ValueError('F177: oversized inputs')
  report=run(dtb,area)
  print(json.dumps(report))
  if not report['crossProductRecordsConsistent']:sys.exit(1)
 except Exception:
  sys.stderr.write('F177: national classification contract refused\n')
  sys.exit(2)
