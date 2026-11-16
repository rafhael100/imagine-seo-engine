import importlib.util
import pathlib
import unittest

src=pathlib.Path(__file__).resolve().parents[1]/'scripts'/'reconcile-pinned-ibge-two-products.py'
spec=importlib.util.spec_from_file_location('f177',src)
f177=importlib.util.module_from_spec(spec)
spec.loader.exec_module(f177)

class TestLagoonsClassification(unittest.TestCase):
 def reference(self):
  d={'1100015':('RO',"Alta Floresta D'Oeste")}
  a={**d,
   '4300001':('RS','Área Operacional "Lagoa Mirim"'),
   '4300002':('RS','Área Operacional "Lagoa dos Patos"')}
  return d,a
 def test_only_two_named_operational_areas_are_separated(self):
  d,a=self.reference()
  x=f177.reconcile(d,a,expected_rows=1)
  self.assertEqual(x['publicOperationalAreaExclusions'],2)
  self.assertEqual(x['unmatchedStatisticalCodes'],0)
  self.assertTrue(x['crossProductRecordsConsistent'])
  self.assertFalse(x['automaticMunicipalPagesAuthorized'])
  self.assertFalse(x['independentAuthorityAuthenticated'])
  self.assertEqual(x['releaseStatus'],'HOLD_INDEPENDENT_EDITORIAL_AND_OPERATIONAL_REVIEW')
 def test_unknown_code_is_not_silently_ignored(self):
  d,a=self.reference()
  a['4300001']=a.pop('4300002')
  with self.assertRaises(ValueError):
   f177.reconcile(d,a,expected_rows=1)
 def test_extra_name_mismatch_is_rejected(self):
  d,a=self.reference()
  a['4300001']=('RS','Cidade inventada')
  with self.assertRaises(ValueError):
   f177.reconcile(d,a,expected_rows=1)
 def test_unapproved_extra_state_is_rejected(self):
  d,a=self.reference()
  a['4300002']=('PE','Área Operacional "Lagoa dos Patos"')
  with self.assertRaises(ValueError):
   f177.reconcile(d,a,expected_rows=1)
 def test_missing_regular_code_is_not_a_consistent_dataset(self):
  d,a=self.reference()
  a.pop('1100015')
  a['1100023']=('RO','Outro Município')
  report=f177.reconcile(d,a,expected_rows=1)
  self.assertFalse(report['crossProductRecordsConsistent'])
  self.assertEqual(report['releaseStatus'],'HOLD_CROSS_PRODUCT_MUNICIPALITY_DISAGREEMENT')
 def test_same_code_disagreeing_in_name_is_not_approved(self):
  d,a=self.reference()
  a['1100015']=('RO','Nome diferente')
  report=f177.reconcile(d,a,expected_rows=1)
  self.assertEqual(report['municipalityNameDisagreements'],1)
  self.assertFalse(report['indexingAuthorized'])

if __name__=='__main__':unittest.main()
