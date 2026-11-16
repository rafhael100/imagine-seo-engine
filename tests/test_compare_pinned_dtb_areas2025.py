import importlib.util
import pathlib
import unittest

file=pathlib.Path(__file__).resolve().parents[1]/'scripts'/'compare-pinned-dtb-areas2025.py'
spec=importlib.util.spec_from_file_location('area_crosscheck',file)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class TestTwoOfficialProducts(unittest.TestCase):
 def test_equal_inputs_still_require_operational_review(self):
  data={'1100015':('RO',"Alta Floresta D'Oeste")}
  report=m.compare(data,data)
  self.assertEqual(report['missingFromArea'],0)
  self.assertEqual(report['municipalityNameDisagreements'],0)
  self.assertTrue(report['geocodesStructurallyEquivalent'])
  self.assertFalse(report['publicationAuthorized'])
  self.assertFalse(report['independentPublisherVerified'])
  self.assertEqual(report['releaseStatus'],'HOLD_EXTERNAL_EDITORIAL_AND_OPERATIONAL_REVIEW')
 def test_mismatched_records_are_aggregated_without_revealing_city(self):
  dtb={'1100015':('RO','Cidade Antiga'),'1100023':('RO','Outra Cidade')}
  area={'1100015':('RO','Cidade Alterada'),'1100031':('RO','Cidade Nova')}
  out=m.compare(dtb,area)
  self.assertEqual(out['missingFromArea'],1)
  self.assertEqual(out['unexpectedAreaCodes'],1)
  self.assertEqual(out['municipalityNameDisagreements'],1)
  self.assertFalse(out['geocodesStructurallyEquivalent'])
  self.assertEqual(out['releaseStatus'],'HOLD_OFFICIAL_PRODUCT_DISAGREEMENT')
  self.assertNotIn('Cidade',str(out))
  self.assertNotIn('1100015',str(out))
 def test_uf_disagreement_is_blocked(self):
  out=m.compare({'1100015':('RO','Local')},{'1100015':('PE','Local')})
  self.assertEqual(out['ufDisagreements'],1)
  self.assertFalse(out['geocodesStructurallyEquivalent'])
 def test_rejects_invalid_area_ods_sheet_xml(self):
  with self.assertRaises(ValueError):
   m.parse_area_xml(b'<root/>')
 def test_canonical_comparison_ignores_accent_only_spelling(self):
  out=m.compare({'1100015':('RO','Sao Joao')},{'1100015':('RO','São João')})
  self.assertEqual(out['municipalityNameDisagreements'],0)

if __name__=='__main__':unittest.main()
