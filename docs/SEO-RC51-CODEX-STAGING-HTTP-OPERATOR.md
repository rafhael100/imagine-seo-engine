# Imagine SEO RC51 — procedimento de validação HTTP no staging (Codex / operador)

**Execute apenas com acesso autorizado ao staging e isolamento comprovado. Não executar em produção.**

## Gate prévio: preservação da VPS

- Mapear contêineres, redes, volumes e portas do Portal, CRM, Sites, Performance, Universidade e Agentes de IA existentes, sem alterar configurações ou assumir que porta esteja livre.
- Não usar a porta 127.0.0.1:18081, que já foi registrada como reservada ao CRM em homologação anterior.
- Estabelecer proxy/Nginx do SEO em porta de loopback EXCLUSIVA, não publicada na Internet e com permissões mínimas. Registro de host, segredo ou IP privado fica fora do GitHub público.
- Backup/restauração e reversão comprovados antes de iniciar testes que possam afetar recursos.

## Gate de auditoria imutável

Na SHA RC51, aplicar `npm test`. Depois, em diretório privado (fora do checkout público), executar:
```bash
node scripts/review-migration-cross-evidence-offline.mjs /PRIVADO/cross-evidence.json > /PRIVADO/revisao-offline-sanitizada.json
```
`0` é apenas revisão humana. O JSON privado contém `gscPageInput`, `migrationInput`, `httpCapture`, `buildDirectory`, conforme contrato F137. Antes de inserir dados reais, verificar consentimento, grants e retenção.

## Gate HTTP local de verdade

Em um segundo manifesto privado, usar `migrationInput` F127 e `loopbackPort` comprovadamente livre. O host antigo e o canônico vão **somente no cabeçalho Host**. Todas as conexões são a 127.0.0.1:
```bash
SEO_F138_ALLOW_LOCAL_HEAD=1 \
node labs/seo-f138-loopback/review-private-loopback-cli.mjs /PRIVADO/manifesto-local.json > /PRIVADO/revisao-head-sanitizada.json
```

- `0`: HEAD 301 → destino exato → HEAD 200, ainda revisão humana.
- `2`: código/destino/salto divergente; **NO-GO**.
- `1`: entrada insegura, autorização ausente, serviço fora do ar ou falha local; **NO-GO**.
- Não assumir que este teste prova TLS, DNS público ou segurança do Nginx: obter HTTP GET/HEAD + certificado por canal **independentemente autenticado** e comparar com os mesmos destinos.

## Finalização

Registrar o hash de cada build, branch, CI, riscos, resultado de F125/F129/F137/F139, mapa de URLs privadas sem torná-las públicas, estado do banco, backups e rollback. Aprovação separada por AppSec/DBA/SEO e produto é obrigatória para merge, deploy, DNS, Cloudflare ou ativação de qualquer evento/cliente.

**Se faltar credencial ou autorização para a VPS/Google, interromper somente a atividade que depende desse acesso e reportar NO-GO. Continuar desenvolvimento local seguro, sem inventar autorização.**
