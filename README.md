# Creative Feed Manager (SaaS MVP)

App interno com arquitetura de Software-as-a-Service, voltado para escalar e organizar criativos em vídeo para tráfego direto (ex: TikTok Ads). O app tem um foco em performance e uma modelagem orientada a catálogo e exports XML rápidos compatíveis com plataformas de anúncios em massa (Dynamic Ads Feed).

## Como rodar o projeto

1. Tenha o Node.js v18 ou v20 instalado.
2. Na pasta raiz do projeto (`creative-feed-manager/`), instale os pacotes:

```bash
npm install
```

3. Existe um arquivo `.env.local` na raiz com as credenciais administrativas do Firebase injetadas automaticamente pra você. Não comite ele em reposórios públicos.

4. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

5. Acesse `http://localhost:3000`. 
**Credenciais para Login Global (MVP):**
Email: `admin@cfm.com`
Senha: `admin`

*(O login é apenas uma verificação Server-Side para proteger as rotas neste MVP, e o sistema gravará a sessão via Next.js Cookies)*

## Arquitetura Resumida
Este projeto utiliza **Next.js 14/15 App Router** com **Tailwind CSS**. A integração com o Firebase é contornada *apenas* via **Server Actions (SSR)** e através do `firebase-admin`, assim o App fica 100% seguro pois expõe zero chaves ao cliente final e reduz problemas de permissões no Storage.

- **Storage**: O fluxo de uploads envia a mídia (vídeo/imagem) para o Next.js, que então armazena nativamente no Cloud Storage assinando um link dinâmico via Admin SDK e retorna URLs seguras e públicas para o Dashboard (ótimo para feeds de plataformas de ad).
- **XML Feed TikTok-first**: A engine de exportação gera objetos no padrão `rss 2.0` injetando fields específicos para produtos, com a forte imposição do `g:video_link` caso presente, compatibilizando o feed com a estrutura para TikTok Dynamic Product Ads ou Meta Ads.

## Preparado para o Futuro
- Banco modelado já esperando Multiorganização (entidades apontam para `organizationId` = `'dev-org'`).
- Módulo de exports persistindo históricos para manter a auditoria.
