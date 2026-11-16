# SEO F139 — CLI privada do laboratório HTTP HEAD em loopback

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação da [F138 #201](https://github.com/rafhael100/imagine-seo-engine/pull/201). Nunca comunica com o Google nem executa deploy.

## Executar somente depois de identificar um proxy de staging autorizado

O operador deve primeiro registrar a configuração do próprio serviço local, escolher uma porta **livre e exclusiva** do staging e confirmar isolamento de contêineres, firewall, backup e ausência de conflito com o CRM/Sites. Não há descoberta automática de portas.

Criar um JSON privado e não versionado com o contrato:

```json
{
  "migrationInput": {
    "sourceType": "operator_supplied_legacy_urls_unverified",
    "siteDomain": "example.test",
    "canonicalOrigin": "https://example.test/",
    "legacyUrls": ["http://www.example.test/"],
    "targetRoutes": ["/"],
    "candidates": [
      {"fromUrl":"http://www.example.test/","toPath":"/","status":301}
    ]
  },
  "loopbackPort": 19090
}
```

O exemplo é sintético. Não presume que a porta 19090 esteja livre; é necessário verificar o ambiente antes de adaptar o arquivo.

```bash
SEO_F138_ALLOW_LOCAL_HEAD=1 node labs/seo-f138-loopback/review-private-loopback-cli.mjs /PRIVADO/manifesto.json > /PRIVADO/resultado-sanitizado.json
```

- **0**: respostas do servidor loopback coerentes com manifesto aprovado, **somente revisão humana**.
- **2**: 301, Location, hop ou status final contraditório — bloquear.
- **1**: input inseguro, porta não alcançável, fonte inválida ou falta do opt-in — bloquear.

O módulo F138 testa no máximo 100 candidatos; toda conexão TCP aponta para **127.0.0.1**. O primeiro HEAD usa o host legado no cabeçalho e o segundo usa o host canônico, mas **nenhum domínio é resolvido em DNS ou seguido automaticamente**. O JSON de saída contém apenas estatísticas e códigos fixos, nunca URLs, porta, host, chaves ou IP.

## Enquadramento de segurança

Todo código com capacidade de rede fica exclusivamente sob `labs/seo-f138-loopback/`. A política F77 segue proibindo importações de rede em `src/` e `scripts/`. Não instalar essa rotina como API pública nem confundir seu opt-in com autenticação de usuário/tenant.

**Este não é um teste TLS/HTTPS real de staging.** O proxy deve ser validado independentemente quanto a host, certificado TLS, comportamento de redirecionamento público, conteúdo editorial, sitemap e rollback, sem mudar DNS ou produção automaticamente.

A CI cria um servidor HTTP temporário na própria máquina e verifica respostas reais, incluindo 301, 302 externo não seguido e erros de segurança, sem tocar qualquer serviço Imagine real.
