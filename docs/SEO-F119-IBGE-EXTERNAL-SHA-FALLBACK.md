# SEO F119 — alternativa offline com SHA-256 externo quando o IBGE estiver indisponível

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
Continua [F118 #169](https://github.com/rafhael100/imagine-seo-engine/pull/169).

## Problema real

Em 15/11/2026 a captura HTTPS real [F117 #166](https://github.com/rafhael100/imagine-seo-engine/pull/166) não conseguiu acessar `servicodados.ibge.gov.br` no runner do GitHub Actions (`curl` exit 28, HTTP 000; Node sem conexão). A lógica unitária passou, mas **nenhum download oficial foi validado**.

Esta etapa oferece um caminho de preparação documental quando o responsável consegue obter o JSON por outro acesso autorizado. Ela não usa um mirror não oficial, não substitui o IBGE por uma cópia sem origem nem afirma que consegue confirmar autenticidade sem evidência.

## Procedimento operador

O operador recebe um arquivo JSON com o formato do endpoint oficial de Localidades e, **por canal confiável independente**, o SHA-256 esperado desse arquivo. O arquivo e o hash devem ser obtidos e guardados com registro de origem, momento, versão e cadeia de custódia.

```bash
node scripts/import-ibge-offline-sha256.mjs \
  source-ibge.json <SHA-256-ESPERADO-OBTIDO-INDEPENDENTEMENTE> \
  reference-new.json receipt-new.json

node scripts/verify-ibge-offline-sha256.mjs \
  source-ibge.json reference-new.json receipt-new.json
```

O hash **não deve ser apresentado como independente se for calculado apenas sobre o mesmo arquivo recebido sem outra evidência**. Isso conferiria integridade relativa ao próprio arquivo, mas não procedência oficial.

## Validação

- Arquivo JSON até 8 MiB, SHA-256 esperado estrito e conteúdo idêntico ao hash.
- Pelo menos 5.500 e no máximo 6.000 linhas, somente como alarme de dataset incompleto; não é selo de município verdadeiro.
- Valida os códigos, nomes, UFs e hierarquias pela F111.
- Normaliza ao contrato F110 e gera recibo com SHA da fonte e do arquivo gerado.
- Grava arquivos privados novos com `wx` e `0600`, nunca sobrescreve ou deixa par de arquivos parcialmente gerados após erro.
- Um segundo comando reprocessa e revalida os **três** arquivos; rejeita divergência de bytes, contagens e flags de autoridade falsas.
- Saída de terminal contém só contagens e flags genéricas: não imprime nomes, conteúdos ou caminhos privados.

## Sem pretensão de autoridade

O recibo mantém `officialOriginAuthenticated=false`, `ibgeHttpsObserved=false`, `territorialEditionConfirmed=false`, `publicationAuthorized=false`. A existência de hash esperado e de arquivo normalizado não estabelece origem IBGE, integridade da edição jurídica, classificação de todas as unidades territoriais ou atendimento da Imagine naquela cidade.

Ainda são necessários: verificação documental da fonte original e sua edição; tipologia territorial completa (incluindo exceções DF e distrito estadual); revisão editorial real; Portal/Sites autenticado; segurança e LGPD; homologação VPS com backups/rollback e aceite de publicação.

**Sem Google, rede externa, alteração em main/VPS, DNS, publicação ou cobrança.**
