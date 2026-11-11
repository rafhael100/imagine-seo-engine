# SEO Offline RC19 — F0–F51

A RC19 consolida as F0–F51. Em relação à RC18, inclui a CLI offline F51 para execução local da revisão GSC F50, sem Google HTTP, sem OAuth, sem credenciais e sem expor termos brutos na saída. Leitor limitado em bytes e testes adversariais de JSON malformado, symlinks e argumentos extras.

Validação antecedente: [F51 CI Node 22/24 aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42947878017), [RC18 CI aprovado](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42947653314), [Comercial RC18 aprovado](https://github.com/rafhael100/imagine-comercial/actions/runs/42947711780). A integração Node F50 → PHP Portal permanece em PR de revisão [GSC-F136](https://github.com/rafhael100/imagine-portal/pull/326).

**Release HOLD:** merge `main`, deploy, dados reais de clientes, DNS, redirects, OAuth e custos não autorizados. Revisão independente, autenticação real do Portal e homologação continuam pendentes.
