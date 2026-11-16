# Imagine SEO Offline RC29 — F0–F66

RC28 F0–F64 mais duas entregas:

- **F65:** comparação offline de duas janelas `query,page`, sempre com dados brutos revalidados por F57/F64, mesma empresa/propriedade e duração, sem exposição de palavras ou URLs. Alertas editoriais conservadores são omitidos se qualquer lote pode estar incompleto.
- **F66:** CLI local, entrada de até 10 MiB, proteção de symlinks e saída agregada sem termos, URLs, tokens ou caminhos de arquivos.

Evidências: [F65 CI aprovada](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43010843077), [F66 CI aprovada](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43011027768), [RC28 CI aprovada](https://github.com/rafhael100/imagine-seo-engine/actions/runs/43009002235).

Os sinais não demonstram canibalização nem cobertura integral do Search Console, mas apoiam revisão editorial. O motor permanece offline, sem credenciais Google, rede, dados reais em Git/CI, clientes, DNS, 301, deploy ou merge `main`. **HOLD** até OAuth/tenant IAM reais do Portal, revisão independente e homologação.
