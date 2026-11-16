# SEO-F103 — Segurança do destino x-default

## Problema

F100 valida a URL canônica local de `x-default`, e F101 exige que as
páginas traduzidas concordem sobre o destino. Entretanto, isso ainda permite
que as versões EN/PT/ES concordem entre si **sobre um destino equivocado**:
a URL `x-default` pode pertencer a outro grupo de `hreflang`, potencialmente
levando o usuário à oferta incorreta.

## Contrato

Quando a auditoria opt-in `--multilingual --check-hreflang` estiver ativa:

- Se a página de destino `x-default` declarar os próprios alternates
  `hreflang`, seu mapa inteiro deverá concordar com o grupo de origem.
- Um `x-default` que aponte para a página PT/EN/ES correta continua válido.
- Uma página seletora neutra e autônoma, **sem alternates**, continua sendo
  um destino permitido pela análise estática. Sua adequação editorial e
  redirecionamento por idioma ainda exigem revisão humana.
- Um destino estrangeiro com grupo próprio gera o diagnóstico genérico
  `hreflang_x_default_foreign_cluster`, sem copiar URLs privadas.
- A regra não altera a análise padrão em português e não gera rotas,
  traduções, regras DNS, redirecionamentos nem publicação.

## Cobertura

Dois testes sintéticos cobrem a tentativa de misturar clusters e o caso
legítimo de página seletora. A suíte completa e o build imutável do Imagine
Comercial são executados em GitHub Actions para cada commit.

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.**
