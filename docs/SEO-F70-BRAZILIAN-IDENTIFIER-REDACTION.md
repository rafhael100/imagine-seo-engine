# SEO-F70 — Consultas com CPF e CNPJ formatados

Amplia a filtragem conservadora de dados pessoais e identificadores na revisão offline de `query,page`. O mecanismo já omitia e-mails, telefones e documentos com rótulos (`CPF:`, `CNPJ:`). Agora também omite padrões **sem rótulo** como `123.456.789-09` e `12.345.678/0001-90`.

- Consulta reconhecida é excluída do cálculo de sobreposição; `redactedRows` aumenta, sem devolver consultas ou URLs.
- F67 converte qualquer comparação temporal com linha omitida para `REDACTED_GSC_ROWS_NO_SIGNALS`, eliminando delta e sinais.
- São padrões textuais, não validadores de dígitos verificadores; falsos positivos conservadores são possíveis.
- Testes usam somente sequências sintéticas. Sem OAuth real, dados de clientes, publicação, deploy ou merge na `main`.
