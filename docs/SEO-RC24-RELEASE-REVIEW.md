# Imagine SEO Offline RC24 — F0–F60

A RC24 incorpora a RC23 (F0–F58) e:
- **F59:** agrupamento e revalidação global de até quatro páginas Search Analytics `query,page` (1.000 linhas por página, 4.000 linhas no lote), com offsets contíguos e detecção de consultas ligadas a várias páginas mesmo quando os registros aparecem em lotes diferentes
- **F60:** CLI local com leitura limitada a 10 MiB, proteção contra symlinks e argumentos inesperados, e saída apenas agregada

Verificações aprovadas:
- [SEO-F59 Node 22/24](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42978552886)
- [SEO-F60 Node 22/24](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42978825171)
- [RC23](https://github.com/rafhael100/imagine-seo-engine/actions/runs/42956880883)

A prova de paginação não implica a identidade da conta Google nem a integralidade das consultas retornadas. Dados reais do OpenSEO permanecem fora do GitHub. **HOLD:** nenhum acesso Google OAuth próprio do Portal, tenant/grant real, deploy, DNS, redirect 301, produção, merge na `main` ou custo novo. Revisão independente e staging são requisitos de liberação.
