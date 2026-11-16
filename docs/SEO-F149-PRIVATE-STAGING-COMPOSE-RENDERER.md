# SEO F149 — Docker Compose de staging gerado com inventário e Nginx aprovados

**DRAFT / NO-GO / NO-MERGE / NO-DEPLOY.** Continuação de [F148 #218](https://github.com/rafhael100/imagine-seo-engine/pull/218), F147 e F145.

## O que foi implementado

O gerador `renderPrivateStagingCompose` só produz um Compose de um único Nginx após:

1. Verificar o inventário privado no contrato F147, exigindo não haver conflitos nas portas, no namespace Compose, em rede e volume declarado, nem insuficiência de memória/CPU.
2. Validar manifesto 301 F127 e HTML compilado real F128 via F145, obtendo digest SHA-256 do build.
3. Ler a configuração Nginx do operador e exigir que os **bytes sejam idênticos** à configuração que F145 geraria do mesmo manifesto e build. Assim uma configuração arbitrária não passa por este comando.
4. Conferir caminhos canônicos de arquivo/diretório sem symlink (inclusive nos componentes da árvore) e limites de tamanho.
5. Renderizar Compose privado, sem executar Docker.

O Compose é restrito a um único contêiner Nginx fixado por digest de imagem, usuário 101:101, rootfs read-only, capabilities removidas, `no-new-privileges`, memória, CPU, PID e tmpfs limitados, mounts de config/HTML **read-only**, rede com nome próprio e **porta escolhida exclusivamente em `127.0.0.1`**. Não cria volume Docker persistente (o identificador de volume do inventário fica apenas reservado). Usa `restart: no` para não iniciar serviços automaticamente após reboot. Nenhum outro projeto é definido ou alterado.

## Uso por operador autorizado na VPS

Pré-requisitos: inventário F148 recente no host correto e revisado, manifesto F127 editorialmente aprovado, build local imutável e configuração Nginx F145 **exatamente correspondente**.

```bash
node scripts/render-private-staging-compose.mjs \
 --inventory /AREA-PRIVADA/host-inventory.json \
 --manifest /AREA-PRIVADA/legacy-plan.json \
 --build /AREA-PRIVADA/build \
 --nginx-conf /AREA-PRIVADA/nginx-staging.conf \
 --out /AREA-PRIVADA/compose-staging.yml
```

O comando cria um arquivo privado `0600` fora do Git, sem sobrescrever versões anteriores, e informa no stdout apenas o parecer sanitizado. **Não chama `docker compose up`, `docker pull`, abre portas ou executa serviços.**

Antes de iniciar qualquer contêiner, é obrigatório revisar com `docker compose -f /AREA-PRIVADA/compose-staging.yml config`, comparar o inventário novo e o estado do CRM/Portal/Sites e confirmar que a imagem Nginx fixada é segura e acessível. A imagem é herança do **laboratório F144**; não está aprovada automaticamente para uso produtivo. O Compose usa uma rede bridge privada com potencial egress: exigir avaliação de firewall/isolamento no host multiempresa e política de rede independente.

## Evidência de CI

A suíte inclui testes para namespace/porta, configuração Nginx obsoleta ou adulterada, links simbólicos, bloqueio de campos de deploy, modo `0600`, SHA da imagem e limites. Um job separado compila fixture privada sintética, gera Compose e executa **apenas `docker compose config --quiet`** em Node 22/24, sem iniciar contêiner ou rede. A validação não usa a VPS, clientes, Search Console real ou DNS.

## Gates reais ainda necessários

- Comprovação atual da porta de loopback livre (a F147/F148 não reserva porta) e recursos suficientes durante o início real.
- Snapshot dos serviços existentes, backup/restauração e rollback testado na VPS; usuário autorizado sem risco de parada do CRM, Portal ou Sites.
- F141–F143 reais com HTTPS/TLS/SNI externos, comportamento Cloudflare e redirecionamentos 301, GSC real por empresa e consentimento.
- Imagem Nginx revisada quanto a CVEs/SBOM, rede/egress, logging e termos de retenção LGPD; conteúdo local útil com dados municipais oficiais.
- Aceite humano específico antes de qualquer merge ou deploy.

**Status: HOLD.** O gerador apenas prepara um arquivo. Não existe novo staging implantado nem URL pública liberada por essa etapa.
