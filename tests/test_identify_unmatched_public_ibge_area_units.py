import importlib.util
import pathlib
import unittest

file=pathlib.Path(__file__).resolve().parents[1]/'scripts'/'identify-unmatched-public-ibge-area-units.py'
spec=importlib.util.spec_from_file_location('f176',file)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class TestPublicTerritorialExceptions(unittest.TestCase):
 def test_refuses_non_pinned_area_file(self):
  with self.assertRaises(ValueError):
   module.inspect(b'not a pinned DTB CSV',b'not original ODS')
 def test_contract_never_reports_legal_approval(self):
  self.assertTrue(module.f175.AREA_ODS_SHA.startswith('029219'))
  self.assertTrue(module.f175.DTB_CSV_SHA.startswith('039f'))
  self.assertEqual(len(module.f175.SPECIAL),2)
 def test_unequal_official_sources_stay_blocked(self):
  dtb={'1100015':('RO','A')}
  area={'1100015':('RO','A'),'1100023':('RO','B')}
  r=module.f175.compare(dtb,area)
  self.assertEqual(r['unexpectedAreaCodes'],1)
  self.assertFalse(r['geocodesStructurallyEquivalent'])
  self.assertFalse(r['publicationAuthorized'])

if __name__=='__main__':unittest.main()
