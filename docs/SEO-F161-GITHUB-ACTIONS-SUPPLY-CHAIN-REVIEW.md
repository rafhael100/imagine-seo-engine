# SEO F161 — revisão estática da cadeia GitHub Actions

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continua F160 e examina os workflows **reais da candidata**, não apenas fixtures.

## Escopo
- Lê os arquivos YAML diretamente do checkout em `.github/workflows`, sem executar workflows, fazer requisições de rede ou acessar segredos.
- Confere referências `uses:` de terceiros fixadas por SHA-1 de 40 caracteres, imagens `docker://` por digest SHA-256 ou ações locais dentro de `.github/actions/`.
- Sinaliza eventos privilegiados `pull_request_target`/`workflow_run`, permissões `write` e checkout com `persist-credentials: true`.
- Exige inventário com pelo menos 30 workflows para detectar coleta truncada.
- Emite contagens e códigos sanitizados, não imprime variáveis secretas nem conteúdos brutos.
- Se houver achados, **falha a CI**; uma CI verde continua sendo **HOLD** até auditoria independente dos scripts, dados e operações.

## Limites
Análise de padrões textuais (não um parser YAML completo), não verifica automaticamente proveniência real de actions, segurança de scripts shell, CVEs, permissões da organização ou tráfego de rede dos workflows. Essas verificações permanecem em revisão AppSec manual.

Toda aprovação de publicação depende também da autenticidade IBGE/DTB, GSC por tenant, editorial, VPS Leaseweb, backup/restauração e rollback.
