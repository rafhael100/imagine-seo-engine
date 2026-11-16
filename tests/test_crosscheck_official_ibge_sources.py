import importlib.util
import pathlib
import unittest

file=pathlib.Path(__file__).resolve().parents[1]/'scripts'/'crosscheck-official-ibge-dtb-api.py'
spec=importlib.util.spec_from_file_location('ibge_crosscheck',file)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def municipality(code,name,uf='RO'):
 return {
  'id':int(code),'nome':name,
  'regiao-imediata':{'regiao-intermediaria':{'UF':{'sigla':uf}}},
  'microrregiao':{'mesorregiao':{'UF':{'sigla':uf}}}
 }
class TestCrossSource(unittest.TestCase):
 def test_code_name_and_uf_agreement_keeps_release_hold(self):
  api=m.parse_api([municipality('1100015',"Alta Floresta D'Oeste")],min_rows=1)
  dtb={'1100015':('RO',"Alta Floresta D’Oeste")}
  r=m.compare(dtb,api)
  self.assertEqual(r['missingFromApi'],0)
  self.assertEqual(r['municipalityNameDisagreements'],0)
  self.assertEqual(r['ufDisagreements'],0)
  self.assertEqual(r['releaseStatus'],'HOLD_INDEPENDENT_EDITORIAL_AND_OPERATIONAL_REVIEW')
  self.assertFalse(r['publicationAuthorized'])
  self.assertFalse(r['independentAuthoritiesEstablished'])
 def test_differences_are_aggregated_not_identified(self):
  old={'1100015':('RO','Cidade Antiga'), '1100023':('RO','Cidade 2')}
  api=m.parse_api([municipality('1100015','Cidade Atual')],min_rows=1)
  r=m.compare(old,api)
  self.assertEqual(r['missingFromApi'],1)
  self.assertEqual(r['municipalityNameDisagreements'],1)
  self.assertEqual(r['releaseStatus'],'HOLD_SOURCE_DISAGREEMENT')
  self.assertNotIn('Cidade',str(r))
  self.assertNotIn('1100015',str(r))
 def test_rejects_inconsistent_uf_and_duplicate_id(self):
  data=[municipality('1100015','Cidade A')]
  data[0]['microrregiao']['mesorregiao']['UF']['sigla']='PE'
  with self.assertRaises(ValueError):m.parse_api(data,min_rows=1)
  dup=[municipality('1100015','Cidade A'),municipality('1100015','Cidade A')]
  with self.assertRaises(ValueError):m.parse_api(dup,min_rows=1)
 def test_rejects_bad_code_state(self):
  with self.assertRaises(ValueError):
   m.parse_api([municipality('5300108','Brasília','RO')],min_rows=1)
 def test_requires_national_count_by_default(self):
  with self.assertRaises(ValueError):
   m.parse_api([municipality('1100015','Cidade A')])

if __name__=='__main__':unittest.main()
