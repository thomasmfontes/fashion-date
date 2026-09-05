# Stitch Design System & Fashion Date Guidelines

Este documento define as regras oficiais de arquitetura visual, design, tipografia, nomenclaturas e padrões de código para o projeto **Fashion Date (7ª Edição · Crente Chic)**. Todas as telas, componentes e refatorações devem seguir estas diretrizes compulsoriamente.

---

## 1. Identidade & Paleta de Cores (Haute Couture)

O design visual é fundamentado na estética de luxo e alta-costura (Haute Couture), combinando vinho marsala, toques dourados e superfícies quentes de marfim/creme:

* **Vinho Marsala Oficial**: `#530017` / `#430014`
  - Utilizado em botões preenchidos (`.stitch-button.filled`), títulos nobres em serifa, estados ativos de navegação (`.stitch-nav-item.active`) e badges de destaque.
* **Ouro Nobre (Dourado)**: `#9a741a` / `#c79a36` / `#855e09`
  - Utilizado em ícones de destaque (`.material-symbols-outlined`), números e códigos de sorteio, kickers e badges dourados (`.stitch-nav-badge.gold`).
* **Superfícies & Fundos**:
  - Background da aplicação: `#fbf9f5` (creme suave).
  - Cards e painéis principais (`.stitch-panel-card`): `#ffffff`.
  - Sub-cards e campos internos: `#fdfaf6` / `#fcfbf9`.
* **Bordas & Delimitadores**:
  - Linhas e contornos sutis: `#ebdcc5` / `#e7ded4` (traço fino de 1px a 1.5px).
  - Nunca usar bordas pretas, cinzas frias ou sombras excessivas.
* **Status Ativo / Sucesso**:
  - Fundo verde claro `#edf7ef`, borda `#c7e8cf`, texto `#1e7239`, indicador pulsante `#22c55e`.

---

## 2. Nomenclatura Obrigatória de Domínio (Copywriting)

Para manter a conformidade com a regulamentação brasileira de sorteios e o padrão de sofisticação do evento:

* ✅ **Sempre utilizar**:
  - **"Número da Sorte"** ou **"Meus Números da Sorte"** (ou **"Números da Sorte"**).
  - **"Sorteios Disponíveis"** / **"Sorteios do Evento"**.
  - **"Garantir Número"** / **"Participar do Sorteio"**.
  - **"Telão Sorteio"** / **"Acompanhar Telão"**.
  - **"Comprovante Oficial"** / **"Compartilhar Comprovante"**.

* 🚫 **Terminantemente proibido**:
  - **NÃO usar "Bilhete"** (remete a loteria tradicional ou transporte).
  - **NÃO usar "Rifa"**, **"Aposta"** ou termos associados a jogos de azar.
  - **NÃO exibir campos confusos como "Número Principal: #—"** (os números pertencem a sorteios específicos).
  - **NÃO poluir a interface com badges soltos de categorias de usuário** (ex: "Lojista Oficial").

---

## 3. Ícones & Simbologia (Material Symbols)

* ✅ **Sorteios & Premiações**:
  - Utilizar **`tune`** (ícone oficial de controles/sorteios padronizado com o menu administrativo).
  - Utilizar **`workspace_premium`** para vencedores e premiações.
  - Utilizar **`live_tv`** para o telão ao vivo.
  - Utilizar **`confirmation_number`** exclusivamente como ícone estilizado dourado de comprovante numérico.
* 🚫 **Proibição Absoluta**:
  - **NUNCA usar `casino` (dado de apostas/cassino)** ou qualquer símbolo de jogatina. O evento é evangélico (*Fashion Date Crente Chic*).

---

## 4. Estrutura de Navegação & Menus Laterais (`stitch-sidebar`)

O menu lateral do participante deve ser **visualmente indistinguível** do menu do administrador:

* **Tags HTML**: Usar sempre tags `<a>` para os itens de navegação (nunca `<button>`, para evitar centralização forçada nativa dos navegadores).
* **Alinhamento**:
  - `.stitch-nav-item`: `display: flex; align-items: center; justify-content: flex-start; gap: 12px; width: 100%; text-align: left;`.
  - `.stitch-nav-label`: `flex: 1; text-align: left; white-space: nowrap;`.
  - O texto do menu deve ficar **imediatamente colado ao ícone** (distância fixa de 12px), com os badges numéricos e o pill `Ao vivo` alinhados à extrema direita.
* **Badge `AO VIVO` / `Ao vivo`**:
  - Sempre com `white-space: nowrap; flex-shrink: 0;` para impedir quebra em duas linhas.
* **Avatar do Usuário (Rodapé)**:
  - Padrão `.stitch-avatar`: proporção 36px (ou 48-56px em credenciais), fundo suave `rgba(83, 0, 23, 0.09)`, letra ou ícone em vinho `#530017`, cantos levemente arredondados (`border-radius: 8px` ou `12px`). Nunca usar blocos escuros sólidos e pesados.

---

## 5. Tipografia

* **Títulos, Cabeçalhos e Destaques**:
  - `font-family: var(--font-fashion, serif)` ("Bodoni Moda", "Cinzel", serif).
  - Letras maiúsculas refinadas com tracking suave (`letter-spacing: 0.02em` a `0.08em`).
* **Corpo de Texto e Controles**:
  - Sans-serif moderno e legível (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, sans-serif).
* **Números da Sorte & Códigos**:
  - `font-family: var(--font-fashion, monospace)`, negrito (`font-weight: 700`), cor `#530017` com `#` prefixado.

---

## 6. Telas & Componentes Padronizados

Ao criar ou editar qualquer tela do sistema:
1. **Container Principal**: Usar `.stitch-admin` com grid padronizado de sidebar + `.stitch-content`.
2. **Cabeçalho de Página**: Sempre usar `<header className="stitch-header">` contendo o título `<h1>` e o status `<span className="stitch-status open">`.
3. **Cards de Métricas**: Usar `.stitch-stats.stitch-draw-stats` com `.stitch-stat-card`.
4. **Painéis de Conteúdo**: Usar `.stitch-panel-card` e, quando houver subtítulos ou filtros, usar `.stitch-controls-header`.
5. **Formatação de Dados**:
   - Telefones: sempre formatados via `formatPhone()` (ex: `(11) 96338-6743`).
   - Nomes: sempre formatados com caixa alta correta via `formatName()`.
   - Datas: formatadas via `formatDate()`.
