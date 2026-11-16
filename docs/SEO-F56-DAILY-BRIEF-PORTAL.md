# SEO-F56 — Dados diários GSC no relatório existente do Portal

O `buildOfflineDailySeoBrief` compõe a análise técnica de HTML/sitemap com a comparação de períodos diários GSC F54, retornando a versão **inalterada** do contrato `seo-brief-offline-v1` já consumida pelo Imagine Portal via F24/F79. Os sinais de revisão são mapeados a códigos conhecidos; o código não repassa texto de busca, caminhos privados, propriedades, mensagens arbitrárias ou dados pessoais.

A análise só inclui os dados orgânicos e sugestões de tendência quando ambas as janelas apresentam cobertura de dias fornecidos completa e nenhuma paginação incerta. Quando incompleta, o relatório retorna somente os achados técnicos e um limite explícito, para não induzir clientes a conclusões falsas.

A implementação revalida os dados originais pelo F52/F54, não aceita um DTO de tendência pré-calculado sem verificação. Testes sintéticos provam compatibilidade direta com `preparePortalSeoHandoff`. Tudo permanece offline e sem OAuth, IAM real, deploy, DNS, dados privados em CI ou merge `main`.
