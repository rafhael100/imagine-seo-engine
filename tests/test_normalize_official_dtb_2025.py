import importlib.util
import pathlib
import unittest

script=pathlib.Path(__file__).resolve().parents[1]/'scripts'/'normalize-official-dtb-2025.py'
spec=importlib.util.spec_from_file_location('dtb_normalizer',script)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def record(uf,code,city):
    parts=[uf,'Estado','001','Região','001','Região','001',code,city]
    cells=''.join('<table:table-cell><text:p>'+v+'</text:p></table:table-cell>' for v in parts)
    return '<table:table-row>'+cells+'</table:table-row>'

def xml(rows):
    return ('<office:document-content '
            'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" '
            'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" '
            'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">'
            '<office:body><office:spreadsheet>'
            '<table:table table:name="DTB_Municípios">'
            +''.join(rows)+'</table:table>'
            '</office:spreadsheet></office:body></office:document-content>').encode('utf-8')

class TestOfficialDtbOfflineNormalizer(unittest.TestCase):
    def test_reads_ods_code_uf_city_columns_and_sorts(self):
        rows=m.parse_ods_rows(xml([
            record('26','2605459','Fernando de Noronha'),
            record('11','1100015',"Alta Floresta D'Oeste"),
            record('53','5300108','Brasília'),
        ]))
        result=m.validate_roster(rows,expected_count=3)
        self.assertEqual([x[0] for x in result],
                         ['1100015','2605459','5300108'])
    def test_rejects_uf_code_conflict(self):
        with self.assertRaises(ValueError):
            m.parse_ods_rows(xml([record('26','5300108','Brasília')]))
    def test_rejects_duplicate_code_and_non_matching_count(self):
        rows=m.parse_ods_rows(xml([
            record('11','1100015','Cidade Modelo'),
            record('11','1100015','Cidade Modelo')]))
        with self.assertRaises(ValueError):
            m.validate_roster(rows,expected_count=2)
        with self.assertRaises(ValueError):
            m.validate_roster(rows,expected_count=5571)
    def test_rejects_unexpected_ods_sheet(self):
        data=xml([record('11','1100015','Cidade Modelo')])
        with self.assertRaises(ValueError):
            m.parse_ods_rows(data.replace('DTB_Municípios'.encode(),'Outro'.encode()))
    def test_rejects_embedded_markup_in_city(self):
        with self.assertRaises(ValueError):
            m.parse_ods_rows(xml([record('11','1100015','&lt;script&gt;')]))

if __name__=='__main__':
    unittest.main()
