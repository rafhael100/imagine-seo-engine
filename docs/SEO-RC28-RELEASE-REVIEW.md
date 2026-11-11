# Imagine SEO Offline RC28 — F0–F64

A RC28 consolida a RC27 F0–F63 e F64, que redige por privacidade URLs de páginas da própria propriedade com parâmetros `?`, sem interromper a análise de outras linhas GSC. A classificação exige host/propriedade válida e caminho seguro. Endereços externos, travessia e aliases codificados continuam recusados. Paginação v2 e F61/F62 permanecem preservadas.

Validações: [RC27 Node 22/24 aprovada](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42981388838), [F64 Node 22/24 aprovada após atualização do teste](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43008874457). A execução anterior de F64 tinha teste legado incompatível, corrigido; não há necessidade de liberar o motor antes de validar a RC28.

**NO-GO produção:** não há OAuth próprio/tenant grant real no Portal, nem deploy, DNS, 301, merge `main`, dados reais GSC em CI ou novos custos. Review AppSec/DBA/LGPD e homologação autenticada ainda são necessários.
