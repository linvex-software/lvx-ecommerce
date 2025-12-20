# 📋 Editor de Menu / Navbar

## 🎯 Onde Configurar o Menu

O editor de menu está integrado ao editor principal do admin. Para acessar:

1. **Acesse o Admin**: Faça login no painel administrativo
2. **Vá para o Editor**: Clique em "Editor" no menu lateral (ou acesse `/editor`)
3. **Selecione "Menu / Navbar"**: Na sidebar esquerda, você verá duas opções:
   - **Homepage** - Para editar o layout da página inicial
   - **Menu / Navbar** - Para configurar o menu de navegação

## 🚀 Como Usar o Editor de Menu

### Interface

O editor está dividido em 3 áreas:

1. **Sidebar Esquerda (Navegação)**
   - Links para alternar entre Homepage e Menu
   - Árvore de itens do menu

2. **Painel Central (Árvore do Menu)**
   - Lista todos os itens do menu
   - Permite drag & drop para reordenar
   - Botões para adicionar/remover itens
   - Expansão/colapso de submenus

3. **Painel Direito (Configurações)**
   - Formulário de edição do item selecionado
   - Configurações específicas por tipo de item

### Adicionar um Item

1. Clique em **"Adicionar Item"** no topo da árvore
2. Selecione o item na árvore
3. Configure no painel direito:
   - **Texto do item**: Nome que aparece no menu
   - **Tipo**: Escolha o tipo (Link, Categoria, Página, etc.)
   - **Configurações específicas**: Dependem do tipo escolhido
   - **Visibilidade**: Desktop, Tablet, Mobile

### Tipos de Itens Disponíveis

#### 1. **Link Simples**
- URL direta
- Abrir em nova aba (opcional)
- Ícone (opcional)

#### 2. **Categorias (Dinâmico)**
- Mostrar todas ou selecionadas
- Ordenação (alfabética, manual, por destaque)
- Profundidade máxima
- Tipo de exibição (Lista, Colunas, Mega Menu)
- Mostrar imagens
- Apenas categorias ativas/com produtos

#### 3. **Página**
- Selecionar página institucional cadastrada
- Link automático para a página

#### 4. **Lista Dinâmica**
- Tipo: Produtos em destaque, Em oferta, Mais vendidos, Lançamentos
- Limite de produtos

#### 5. **Bloco Visual**
- Tipo: Banner, Imagem, Card de Produto, CTA
- Configurações específicas de cada tipo

#### 6. **Submenu**
- Container para agrupar itens filhos
- Permite criar hierarquias complexas

### Reordenar Itens

- **Drag & Drop**: Arraste um item para reordenar
- Os itens são salvos automaticamente na ordem definida

### Criar Submenus

1. Clique no botão **"+"** ao lado de um item
2. Um novo item filho será criado
3. Configure o item filho normalmente
4. Os submenus aparecem em dropdown (desktop) ou accordion (mobile)

### Salvar Alterações

1. Configure todos os itens desejados
2. Clique em **"Salvar Menu"** no topo direito
3. As alterações são aplicadas imediatamente

## 📱 Comportamento no Frontend

### Desktop
- **Links simples**: Aparecem como links normais
- **Categorias**: Podem aparecer como dropdown ou mega menu (configurável)
- **Submenus**: Aparecem como dropdown ao passar o mouse
- **Mega Menu**: Categorias podem exibir em colunas com imagens

### Mobile
- Todos os itens aparecem em **accordion**
- Toque para expandir/colapsar submenus
- Respeita configurações de visibilidade por breakpoint

## 🔧 Configurações Avançadas

### Visibilidade por Breakpoint

Cada item pode ser configurado para aparecer apenas em:
- **Desktop**: Apenas em telas grandes
- **Tablet**: Apenas em tablets
- **Mobile**: Apenas em celulares

### Estilos Customizados

Os itens podem ter estilos personalizados:
- Cor do texto
- Cor ao passar o mouse
- Tamanho da fonte
- Padding e margem
- Bordas e cantos arredondados

## 🎨 Exemplos de Uso

### Menu Básico
```
- Home
- Produtos (Categorias dinâmicas)
- Sobre Nós (Página)
- Contato (Link)
```

### Menu com Submenus
```
- Produtos
  - Feminino (Categoria)
  - Masculino (Categoria)
  - Acessórios (Categoria)
- Ofertas
  - Ofertas da Semana (Link)
  - Outlet (Link)
  - Até R$99 (Link)
```

### Menu com Mega Menu
```
- Moda (Categoria com mega menu)
  - Feminino (com imagens)
  - Masculino (com imagens)
  - Infantil (com imagens)
  - Banner promocional (Bloco visual)
```

## ⚠️ Importante

- **Salve sempre**: Clique em "Salvar Menu" após fazer alterações
- **Teste no frontend**: Verifique como o menu aparece na loja
- **Visibilidade**: Use as configurações de visibilidade para criar menus diferentes por dispositivo
- **Hierarquia**: Não crie mais de 3 níveis de profundidade (melhor UX)

## 🐛 Troubleshooting

### Menu não aparece no frontend
- Verifique se há itens visíveis
- Verifique as configurações de visibilidade por breakpoint
- Limpe o cache do navegador

### Itens não salvam
- Verifique se está logado como admin
- Verifique a conexão com a API
- Veja o console do navegador para erros

### Drag & drop não funciona
- Recarregue a página
- Verifique se o JavaScript está habilitado



