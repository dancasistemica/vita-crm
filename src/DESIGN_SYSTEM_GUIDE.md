# Design System Guide

Guia central de padroes visuais para garantir consistencia em toda a aplicacao.

## Objetivo

- Definir hierarquia de tipografia, botoes, espacamentos e layout.
- Padronizar o uso de cores semanticas.
- Servir como referencia unica para novas paginas e componentes.

## Fonte da Verdade

- Tokens: `src/styles/design-tokens.ts`
- Padroes globais: `src/styles/design-system-standards.ts`

## Como Usar

### Tipografia

Use as classes de `designSystemStandards.typography` para manter hierarquia visual.

Exemplo:

```tsx
<h1 className={designSystemStandards.typography.pageTitle.className}>Vendas</h1>
<p className={designSystemStandards.typography.bodySmall.className}>Resumo do periodo</p>
```

### Botoes

Padrao de botoes por tipo e tamanho:

```tsx
<button className={`${designSystemStandards.buttons.primary.className} ${designSystemStandards.buttons.primary.sizes.md}`}>
  Salvar
</button>
```

### Espacamentos

Padrao para container de pagina e secoes:

```tsx
<main className={designSystemStandards.spacing.pageContainer.className}>
  <section className={designSystemStandards.spacing.sectionSpacing.className}>
    ...
  </section>
</main>
```

### Layouts

Use `designSystemStandards.layout` como referencia de estrutura para header, filtros e modais.

### Cores Semanticas

Classes semanticas padronizadas em `designSystemStandards.colors`:

```tsx
<div className={designSystemStandards.colors.status.success.className}>
  Operacao concluida com sucesso
</div>
```

## Regras de Consistencia

- Titulo de pagina sempre com `pageTitle`.
- Botoes primarios e secundarios seguem o padrao de posicionamento.
- Cards e filtros usam `background.card` e bordas `border.default`.
- Inputs e botoes devem manter `state.focus` visivel.

## Fase 2

Atualizacao de componentes existentes para aderir integralmente aos padroes globais.
