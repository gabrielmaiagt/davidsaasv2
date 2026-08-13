# TikTok Catalog — Documentação de Referência

> Documento de apoio do **Creative Feed Manager**.
> Reúne (a) as regras oficiais do TikTok para catálogo e (b) o que descobrimos na
> prática investigando as falhas de entrega em 10–13/08/2026.
> Onde a fonte é empírica (nossa investigação), está marcado como **[observado]**.

---

## 1. Como o catálogo funciona

```
Nosso app  ──gera──>  Feed XML (URL pública)
                            │
                            ▼
              TikTok Catalog Manager  ──lê a URL a cada ~1h
                            │
                            ├─ valida os campos do produto     → produto fica "Ativo"
                            └─ baixa e PROCESSA vídeo/imagem   → asset fica disponível
                                        │
                                        ▼
                        Ad Group (Video Shopping Ads) entrega
```

Os dois passos são **independentes**, e é daí que nasce a confusão mais comum:
um produto pode aparecer **Ativo** no catálogo enquanto o vídeo dele **ainda não
terminou de ser processado** — e nesse intervalo o anúncio não entrega.

---

## 2. Campos do feed

### Obrigatórios

| Campo | No nosso XML | Limite | Observação |
|---|---|---|---|
| `sku_id` | `g:id` | 150 | Único por produto |
| `title` | `g:title` | 255 | Nome comercial real |
| `description` | `g:description` | 10.000 | |
| `availability` | `g:availability` | — | `in stock`, `out of stock`, `preorder` |
| `condition` | `g:condition` | — | `new`, `used`, `refurbished` |
| `price` | `g:price` | — | Valor + ISO 4217: `61.90 BRL` |
| `link` | `g:link` | 2.000 | Landing page |
| `image_link` | `g:image_link` | 2.000 | |
| `brand` | `g:brand` | 200 | |
| `google_product_category` | `g:google_product_category` | 750 | **Taxonomia do Google** |

### Opcionais relevantes

`sale_price`, `sale_price_effective_date`, `additional_image_link`,
`item_group_id`, `color`, `size`, `gender`, `age_group`, `product_type`,
**`video_link`** (essencial para Video Shopping Ads).

### ⚠️ `google_product_category` — erro que já cometemos

Só aceita **ID numérico** ou o **caminho completo** da taxonomia do Google.

```xml
<!-- INVÁLIDO — era o que a gente mandava -->
<g:google_product_category>Geral</g:google_product_category>

<!-- VÁLIDO -->
<g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Cookware &amp; Bakeware</g:google_product_category>
```

`product_type` é campo livre — aí sim pode usar nomenclatura própria.

---

## 3. Mídia

### Imagem
- JPEG ou PNG
- **Mínimo 500x500 px** (recomendado 800x800+)
- Product cards usam 1:1; shopping ads usam 9:16

### Vídeo (`video_link`)
- MP4 ou MOV, vertical **9:16**
- **Mínimo 720x1280 px**, bitrate a partir de ~516 kbps
- Duração recomendada: 15–60 s
- Limite de arquivo para catálogo de Ads: 500 MB
- **Listagem de TikTok Shop: máximo 5 MB** (erro `PRODUCT_VIDEO_EXCEEDS_5_MB_SIZE`)

> **[observado]** Campanhas nossas rodaram meses com vídeos em **464x848** e
> **576x1024** — abaixo do mínimo documentado — sem serem reprovadas. Ou seja, o
> 720x1280 na prática se comporta como recomendação, não como bloqueio rígido.
> Ainda assim, **não fazer upscale**: aumentar resolução não cria detalhe, só
> multiplica o custo de banda.

---

## 4. Formato e entrega do feed

- Formatos aceitos: **XML (RSS/ATOM)**, CSV, TSV, ZIP, GZ — sempre **UTF-8**
- Nosso app entrega RSS 2.0 com namespace `xmlns:g="http://base.google.com/ns/1.0"`
- **Releitura automática: a cada ~1 hora** para URL agendada

### Regras da URL do feed **[observado]**

| Regra | Motivo |
|---|---|
| Deve responder **200 direto** | Crawler pode não seguir redirect (307) |
| Deve ser estável | Trocar/apagar a URL derruba o catálogo com 404 |
| `<link>` do canal precisa ser domínio real | Já mandamos `creative-feed.local`, que não existe |

⚠️ **No nosso app**, duas ações matam a URL de feed em produção, sem aviso:
1. **"Atualizar Feed"** → sorteia um `feedToken` novo (URL antiga vira 404)
2. **Deletar campanha** → a URL some

Alternativa estável: usar a URL por **ID do documento**, que nunca muda.

---

## 5. "Asset unavailable or authorization revoked"

Segundo a documentação de status do TikTok, **"asset"** aqui **não é o arquivo de
vídeo** — são os assets do Business Center:

> **catalogs, pixel, identity, shop**

### ✅ Causa mais comum **[observado — confirmado em 13/08]**

**É estado transitório: a fila de processamento de mídia do TikTok.**

Enquanto o TikTok não termina de baixar e processar os assets do catálogo, os ad
groups ficam "Not delivered / Asset unavailable". Quando termina, **voltam para
Active sozinhos**, de forma gradual (uns ativam antes dos outros).

Evidência: a campanha *lava2* exibiu o erro por horas e depois ativou sozinha,
sem nenhuma intervenção.

**O tempo de espera cresce com o tamanho do catálogo.** E — ponto crítico —
**qualquer mexida zera a fila e recomeça**:
- duplicar criativos
- clicar em "Atualizar Feed"
- recriar o catálogo no TikTok
- trocar os arquivos de vídeo no Storage

> Foi exatamente esse o erro de operação em 10–13/08: reiniciamos a fila a cada
> poucas horas e estranhamos que ela nunca terminava.

### Outras causas (checar se persistir por muitas horas)
1. Catálogo não compartilhado com a **ad account** (não basta estar ativo)
2. Ad group referenciando **product set de um catálogo deletado**
3. **Identity** desconectada/expirada
4. **Pixel** sem permissão
5. Feed retornando 404 (URL trocada — ver §4)

---

## 6. Custo de banda — o efeito da diversificação **[observado]**

Nosso app dá URL única a cada duplicata (`?v=SKU`) de propósito, para que o
TikTok não identifique criativo reciclado. O efeito colateral é que ele **não
deduplica**: baixa o mesmo arquivo físico uma vez por duplicata.

```
67.819 criativos  →  apontam para  →  90 arquivos físicos
Uma varredura completa = 67.819 downloads
```

Medições reais:

| Situação | Egress | Média/requisição | Custo aprox. |
|---|---|---|---|
| Vídeos de 26 MB | ~90 GB/h | 26,4 MB | ~R$60/h |
| Vídeos de 4,3 MB | ~6,7 GB/h | 4,3 MB | ~R$5/h |

**Regra prática:** o custo é `tamanho do arquivo × número de duplicatas`.
Reduzir o arquivo é a alavanca mais barata — não mexe em nenhum registro do
banco, porque as duplicatas apontam para os mesmos arquivos.

Alvo recomendado: **≤ 5 MB por vídeo**, mantendo ≥ 720x1280.

---

## 7. Qualidade de conteúdo **[observado]**

O título do produto é o que aparece no anúncio. Já mandamos coisas assim:

```
"6Confira"            "✦ 4"            "4 - - • Exclusivo"
```

Causa: o título vinha do **nome do arquivo** (`1.MP4` → título `"1"`) e a
diversificação decorava por cima. Corrigido — hoje o título vem do campo
**Nome do Produto** da campanha.

**Regra:** título tem que ser nome comercial real
(`Jogo de Panelas Antiaderente Cerâmica 10 Peças`), nunca nome de arquivo.

---

## 8. UTM / rastreamento

Macros dinâmicas, preenchidas pelo TikTok no clique (sempre **dois** underscores):

| Macro | Conteúdo |
|---|---|
| `__CAMPAIGN_NAME__` | Nome da campanha |
| `__AID_NAME__` | Nome do **ad group** (apesar do "AID") |
| `__CID_NAME__` | Nome do **criativo** |
| `__CID__` | ID do criativo |

⚠️ `_CID_` (um underscore) **não funciona** — vira texto literal.

> **[observado]** Em 10/08 injetamos UTM em **todos** os produtos de campanhas
> que já rodavam. Mudar a URL de destino de anúncio ativo dispara re-revisão e
> derruba a entrega. **Se for aplicar UTM, aplicar só em campanha nova.**

---

## 9. Checklist antes de subir catálogo

**No app**
- [ ] Campanha com **Nome do Produto** preenchido
- [ ] Link de destino correto e acessível
- [ ] Vídeos ≤ 5 MB, ≥ 720x1280, 9:16
- [ ] Thumbnail ≥ 500x500

**Feed**
- [ ] URL responde **200 direto** (sem redirect)
- [ ] Abrir e conferir alguns `<item>`
- [ ] Nenhum título genérico ou vindo de nome de arquivo

**No TikTok**
- [ ] Catálogo **compartilhado com a ad account**
- [ ] Product set apontando para o catálogo **atual**
- [ ] Identity e pixel conectados

**Depois de subir**
- [ ] **NÃO MEXER.** Nada de duplicar, atualizar feed ou recriar catálogo
- [ ] Esperar a fila de processamento — quanto maior o catálogo, mais demora
- [ ] Só investigar se continuar falhando após várias horas **sem nenhuma mexida**

---

## 10. Diagnóstico rápido

```bash
node scripts/audit-feed.cjs <feedToken>        # valida o XML campo a campo
node scripts/check-assets-health.cjs "<campanha>"  # testa vídeos/imagens (HTTP)
node scripts/what-is-being-pulled.cjs          # egress + o que está sendo baixado
node scripts/probe-big-videos.cjs              # ranking de custo por arquivo
node scripts/shrink-heavy-videos.cjs           # comprime (dry-run; --apply envia)
```

---

## Fontes

- [Ad group statuses | TikTok Ads Manager](https://ads.tiktok.com/help/article/ad-group-statuses-and-definitions?lang=en)
- [Ad statuses and definitions | TikTok Ads Manager](https://ads.tiktok.com/help/article/ad-statuses-and-definitions-in-ads-manager?lang=en)
- [Best practices for catalog | TikTok For Business](https://ads.tiktok.com/help/article/best-practices-for-a-high-quality-catalog?lang=en)
- [About UTM Parameters | TikTok Ads Manager](https://ads.tiktok.com/help/article/track-offsite-web-events-with-utm-parameters)
- [TikTok Catalog: required fields & feed format | WisePIM](https://wisepim.com/guides/product-feed-optimization/tiktok-catalog)
- [Product video exceeds 5 MB size limit | GoDataFeed](https://www.godatafeed.com/disapproval/tiktok-product-video-exceeds-5-mb-size-limit)
- [TikTok Catalog Ads setup guide | Cropink](https://cropink.com/tiktok-catalog-ads)

*Última atualização: 13/08/2026*
