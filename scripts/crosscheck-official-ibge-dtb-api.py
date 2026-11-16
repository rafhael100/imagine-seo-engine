#!/usr/bin/env python3
"""F173: private, offline comparison between IBGE DTB CSV and IBGE API JSON.

The transport and origin of both files are proven by the caller's CI steps.
This module never opens a URL or publishes any municipality row.
"""
import csv
import hashlib
import json
import re
import sys
import unicodedata

STATE_PREFIX={
 'RO':'11','AC':'12','AM':'13','RR':'14','PA':'15','AP':'16','TO':'17',
 'MA':'21','PI':'22','CE':'23','RN':'24','PB':'25','PE':'26','AL':'27',
 'SE':'28','BA':'29','MG':'31','ES':'32','RJ':'33','SP':'35','PR':'41',
 'SC':'42','RS':'43','MS':'50','MT':'51','GO':'52','DF':'53'
}
EXPECTED_DTB_CSV="039f535dbf413a6cd7c5e09e82168a5e46e28e605ddf54c672b4410111ed3818"

def fail():
 raise ValueError("F173: official sources inconsistent or malformed")

def normalize_name(x):
 x=''.join(c for c in unicodedata.normalize('NFD',x)
           if unicodedata.category(c)!='Mn')
 return ' '.join(x.lower().replace('’',"'").replace('‘',"'").split())

def uf_of_api(record):
 found=[]
 if isinstance(record.get('regiao-imediata'),dict):
  x=record['regiao-imediata'].get('regiao-intermediaria')
  if isinstance(x,dict) and isinstance(x.get('UF'),dict):
   found.append(x['UF'].get('sigla'))
 if isinstance(record.get('microrregiao'),dict):
  x=record['microrregiao'].get('mesorregiao')
  if isinstance(x,dict) and isinstance(x.get('UF'),dict):
   found.append(x['UF'].get('sigla'))
 if not found or any(y!=found[0] for y in found) or found[0] not in STATE_PREFIX:
  fail()
 return found[0]

def parse_api(payload,min_rows=5500):
 if not isinstance(payload,list) or len(payload)<min_rows or len(payload)>6000:
  fail()
 result={}
 for record in payload:
  if not isinstance(record,dict):
   fail()
  raw=record.get('id')
  code=str(raw) if type(raw) in (int,str) else ''
  name=record.get('nome')
  if not re.fullmatch(r'[0-9]{7}',code) or type(name) is not str or not 2<=len(name)<=120:
   fail()
  uf=uf_of_api(record)
  if code[:2]!=STATE_PREFIX[uf] or code in result:
   fail()
  result[code]=(uf,name)
 return result

def parse_dtb(data):
 if hashlib.sha256(data).hexdigest()!=EXPECTED_DTB_CSV:
  raise ValueError("F173: private DTB CSV differs from pinned F172 receipt")
 text=data.decode('utf-8')
 rows=csv.DictReader(text.splitlines(),delimiter=';')
 if rows.fieldnames!=['ibgeCode','state','city']:
  fail()
 data={}
 for row in rows:
  if set(row)!=set(rows.fieldnames):
   fail()
  code,uf,name=row['ibgeCode'],row['state'],row['city']
  if not re.fullmatch(r'[0-9]{7}',code) or uf not in STATE_PREFIX or not name or code in data:
   fail()
  if code[:2]!=STATE_PREFIX[uf]:
   fail()
  data[code]=(uf,name)
 if len(data)!=5571:
  fail()
 return data

def compare(dtb,api):
 left,right=set(dtb),set(api)
 mismatch_name=0;mismatch_uf=0
 for code in left & right:
  d,a=dtb[code],api[code]
  if d[0]!=a[0]:mismatch_uf+=1
  if normalize_name(d[1])!=normalize_name(a[1]):mismatch_name+=1
 disagreements=(len(left-right)+len(right-left)+mismatch_name+mismatch_uf)
 return {
  'contractVersion':'seo-f173-official-dtb-api-crosscheck-v1',
  'dtbRows':len(dtb),
  'apiRows':len(api),
  'missingFromApi':len(left-right),
  'unexpectedInApi':len(right-left),
  'municipalityNameDisagreements':mismatch_name,
  'ufDisagreements':mismatch_uf,
  'officialPublishedEndpointsCompared':2,
  'sameGovernmentPublisher':True,
  'independentAuthoritiesEstablished':False,
  'externalEditorialApproval':False,
  'publicationAuthorized':False,
  'releaseStatus':'HOLD_SOURCE_DISAGREEMENT' if disagreements else
    'HOLD_INDEPENDENT_EDITORIAL_AND_OPERATIONAL_REVIEW'
 }

if __name__=='__main__':
 try:
  if len(sys.argv)!=3:fail()
  with open(sys.argv[1],'rb') as f:dtb_bytes=f.read(1024*1024+1)
  with open(sys.argv[2],'rb') as f:api_bytes=f.read(20_000_001)
  if len(dtb_bytes)>1024*1024 or len(api_bytes)>20_000_000:fail()
  result=compare(parse_dtb(dtb_bytes),parse_api(json.loads(api_bytes)))
  result['apiPayloadSha256']=hashlib.sha256(api_bytes).hexdigest()
  print(json.dumps(result,ensure_ascii=False))
  if result['releaseStatus']=='HOLD_SOURCE_DISAGREEMENT':
   sys.exit(1)
 except Exception:
  sys.stderr.write("F173: official cross-source input unavailable or invalid\n")
  sys.exit(2)
