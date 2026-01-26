# 📄 Páginas Institucionais (FAQ e Política de Troca)

## Visão Geral

O sistema de páginas dinâmicas permite criar e editar páginas institucionais como FAQ e Política de Troca diretamente pelo admin, sem necessidade de código ou deploy.

## 🚀 Como Criar as Páginas Iniciais

### Opção 1: Via Script (Recomendado)

Execute o script para criar as páginas iniciais automaticamente:

```bash
# Usando a primeira loja encontrada
pnpm tsx scripts/create-institutional-pages.ts

# Ou especificando o storeId
pnpm tsx scripts/create-institutional-pages.ts [storeId]
```

O script criará:
- **FAQ** (`/faq`) - Perguntas Frequentes
- **Política de Troca** (`/politica-troca`) - Política de Troca e Devolução

### Opção 2: Manualmente pelo Admin

1. Acesse o Admin → **Editor** → **Páginas**
2. Clique em **"Nova Página"**
3. Preencha:
   - **Título**: "Perguntas Frequentes" ou "Política de Troca e Devolução"
   - **Slug**: `faq` ou `politica-troca`
   - **Publicada**: ✅ (marque quando estiver pronto)
4. Edite o conteúdo visualmente usando o editor Craft.js
5. Salve e publique

## 📍 Onde Aparecem na Loja

### Footer
As páginas já estão linkadas no Footer do template:
- **Perguntas Frequentes** → `/faq`
- **Política de Troca** → `/politica-troca`

### Rotas Automáticas
As rotas funcionam automaticamente via Next.js:
- `/faq` → Renderiza a página FAQ
- `/politica-troca` → Renderiza a página Política de Troca

## ✏️ Como Editar

1. Acesse **Admin** → **Editor** → **Páginas**
2. Clique no ícone de **editar** (✏️) na página desejada
3. Use o editor visual para:
   - Adicionar/remover blocos
   - Editar textos
   - Ajustar estilos
   - Reordenar elementos
4. Clique em **Salvar**
5. Marque como **Publicada** para aparecer na loja

## 🧩 Componentes Disponíveis

### TextBlock
Bloco de texto editável com suporte a HTML:
- Alinhamento (esquerda, centro, direita)
- Tamanhos (sm, md, lg, xl)
- Conteúdo HTML

### FAQ
Componente de acordeão para perguntas e respostas:
- Título configurável
- Lista de itens (pergunta/resposta)
- Cores e estilos customizáveis

### Outros Componentes
- Hero (banner principal)
- Banner (banner simples)
- Newsletter
- Depoimentos
- Grade de Produtos
- E mais...

## 🎨 Estrutura das Páginas

### FAQ
- Título: "Perguntas Frequentes"
- Componente FAQ com 5 perguntas/respostas padrão
- Totalmente editável pelo admin

### Política de Troca
- Título: "Política de Troca e Devolução"
- 3 seções de texto:
  1. Prazo para Troca ou Devolução
  2. Como Solicitar Troca ou Devolução
  3. Reembolso
- Totalmente editável pelo admin

## 🔧 Tecnologias

- **Craft.js**: Editor visual drag-and-drop
- **Next.js**: Renderização server-side
- **PostgreSQL**: Armazenamento do conteúdo
- **React**: Componentes reutilizáveis

## 📝 Notas Importantes

1. **Slugs Únicos**: Cada loja pode ter apenas uma página com cada slug
2. **Publicação**: Páginas só aparecem na loja se estiverem marcadas como "Publicadas"
3. **Cache**: Mudanças podem levar alguns segundos para aparecer (cache do Next.js)
4. **Conteúdo HTML**: O TextBlock suporta HTML, mas use com cuidado

## 🐛 Troubleshooting

### Página não aparece na loja
- Verifique se está marcada como "Publicada"
- Verifique se o slug está correto
- Limpe o cache do navegador

### Erro ao salvar
- Verifique se o slug contém apenas letras minúsculas, números e hífens
- Verifique se não há outra página com o mesmo slug

### Componentes não aparecem
- Verifique se os componentes do template estão carregados
- Recarregue a página do editor

## 📚 Referências

- [Documentação do Craft.js](https://craft.js.org/)
- [Sistema de Páginas Dinâmicas](./PROJECT-STRUCTURE.md#páginas-dinâmicas)
