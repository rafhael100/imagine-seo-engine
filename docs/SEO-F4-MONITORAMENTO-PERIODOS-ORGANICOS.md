# SEO-F4 — Comparação de crescimento e regressões orgânicas (offline)

## Finalidade
Preparar o monitoramento recorrente do SEO da Imagine usando dados provenientes da propriedade Search Console, antes da conexão OAuth e sem afirmar resultados não medidos.

## Entrega
- `compareGscPeriods(previous,current)`: aceita **duas exportações autorizadas** da dimensão `query` já compatíveis com SEO-F1.
- Compara janelas de mesma duração, sem sobreposição; agrupa buscas por marca e pelos serviços prioritários.
- Calcula variação de impressões, cliques e CTR; compara **posição média**, não rankings absolutos.
- Sinaliza apenas casos candidatos à investigação: quedas expressivas de impressões, cliques, CTR e deterioração da posição média, considerando mínimos de volume.
- Gera sinal de novo cluster visível e registra limitações de dados amostrados, anonimizados ou incompletos.
- Não expõe consultas brutas, e-mail ou telefone; a filtragem inicial dos dois períodos usa SEO-F1.
- CLI: `node scripts/compare-gsc-offline.mjs periodo-anterior.json periodo-atual.json`.
- Testes de casos sintéticos, janela divergente, amostras pequenas e privacidade.

## Próximos passos operacionais
O monitoramento verdadeiro só poderá usar dados autorizados, conectados com consentimento e política de retenção. Construir linha de base por tipo de página, região e dispositivo, e cruzar com conversões do Portal para distinguir visitas de oportunidades efetivas. Atribuição e tendências serão contextualizadas com sazonalidade, decisões editoriais e alterações técnicas.

Não cria tarefa agendada, não conecta Google, não realiza scraping nem publica conteúdo. Não garante posição nacional.

Dependência: SEO-F1 e SEO-F3. PR draft, sem gastos ou produção.
