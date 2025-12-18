/**
 * Microcopy Padrão - Design System
 *
 * Padrões de texto profissional, direto e claro (SaaS moderno).
 */

export const microcopy = {
  // ============================================
  // TÍTULOS
  // ============================================
  titles: {
    dashboard: 'Dashboard',
    products: 'Produtos',
    categories: 'Categorias',
    orders: 'Pedidos',
    stock: 'Estoque',
    users: 'Equipe',
    settings: 'Configurações',
    store: 'Loja',
    editor: 'Editor',
    coupons: 'Cupons',
    physicalSales: 'Vendas Físicas',
  },

  // ============================================
  // DESCRIÇÕES
  // ============================================
  descriptions: {
    dashboard: 'Visão geral do seu negócio',
    products: 'Gerencie o catálogo de produtos da sua loja',
    categories: 'Organize e gerencie as categorias do seu catálogo',
    orders: 'Gerencie os pedidos da sua loja',
    stock: 'Gerencie o estoque de todos os produtos',
    users: 'Gerencie membros da equipe e permissões',
    settings: 'Configurações da loja',
    store: 'Configurações da loja',
    editor: 'Personalize o design da sua loja',
    coupons: 'Crie e gerencie cupons de desconto',
    physicalSales: 'Registre vendas físicas',
  },

  // ============================================
  // PLACEHOLDERS
  // ============================================
  placeholders: {
    search: 'Buscar...',
    searchProducts: 'Buscar produtos...',
    searchCategories: 'Buscar por nome ou slug',
    searchOrders: 'Buscar pedidos...',
    searchUsers: 'Buscar membros...',
    email: 'seu@email.com',
    name: 'Nome completo',
    phone: '(00) 00000-0000',
    price: '0,00',
    quantity: '0',
    description: 'Digite uma descrição',
    notes: 'Adicione observações',
    password: '••••••••',
    confirmPassword: 'Confirme sua senha',
    url: 'https://exemplo.com',
    code: 'Código',
    title: 'Título',
    subtitle: 'Subtítulo',
    slug: 'endereco-da-categoria',
    sku: 'SKU-001',
    barcode: 'Código de barras',
  },

  // ============================================
  // LABELS DE CAMPOS
  // ============================================
  labels: {
    name: 'Nome',
    email: 'E-mail',
    phone: 'Telefone',
    password: 'Senha',
    confirmPassword: 'Confirmar senha',
    role: 'Função',
    status: 'Status',
    price: 'Preço',
    quantity: 'Quantidade',
    description: 'Descrição',
    image: 'Imagem',
    images: 'Imagens',
    category: 'Categoria',
    categories: 'Categorias',
    parentCategory: 'Categoria superior',
    slug: 'Endereço da categoria (URL)',
    sku: 'SKU',
    barcode: 'Código de barras',
    weight: 'Peso',
    dimensions: 'Dimensões',
    active: 'Ativo',
    inactive: 'Inativo',
    published: 'Publicado',
    unpublished: 'Não publicado',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    actions: 'Ações',
    createdAt: 'Criado em',
    updatedAt: 'Atualizado em',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Desconto',
    shipping: 'Frete',
    customer: 'Cliente',
    orderNumber: 'Número do pedido',
    orderDate: 'Data do pedido',
    orderStatus: 'Status do pedido',
    paymentMethod: 'Forma de pagamento',
    shippingAddress: 'Endereço de entrega',
  },

  // ============================================
  // BOTÕES
  // ============================================
  buttons: {
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    create: 'Criar',
    add: 'Adicionar',
    remove: 'Remover',
    confirm: 'Confirmar',
    close: 'Fechar',
    back: 'Voltar',
    next: 'Próximo',
    previous: 'Anterior',
    submit: 'Enviar',
    search: 'Buscar',
    filter: 'Filtrar',
    reset: 'Limpar',
    apply: 'Aplicar',
    export: 'Exportar',
    import: 'Importar',
    download: 'Baixar',
    upload: 'Enviar',
    view: 'Visualizar',
    duplicate: 'Duplicar',
    archive: 'Arquivar',
    restore: 'Restaurar',
    publish: 'Publicar',
    unpublish: 'Despublicar',
    activate: 'Ativar',
    deactivate: 'Desativar',
    logout: 'Sair',
    login: 'Entrar',
    register: 'Cadastrar',
    update: 'Atualizar',
    createNew: 'Criar novo',
    addNew: 'Adicionar novo',
    newProduct: 'Novo produto',
    newCategory: 'Nova categoria',
    manage: 'Gerenciar',
    select: 'Selecionar',
    clear: 'Limpar',
    loading: 'Carregando...',
    saving: 'Salvando...',
    deleting: 'Excluindo...',
  },

  // ============================================
  // MENSAGENS DE ERRO
  // ============================================
  errors: {
    required: 'Este campo é obrigatório',
    invalidEmail: 'Digite um e-mail válido',
    invalidPhone: 'Digite um telefone válido',
    invalidUrl: 'Digite uma URL válida',
    invalidPrice: 'Digite um preço válido',
    invalidQuantity: 'Digite uma quantidade válida',
    passwordTooShort: 'A senha deve ter no mínimo 8 caracteres',
    passwordMismatch: 'As senhas não coincidem',
    minLength: (min: number) => `Mínimo de ${min} caracteres`,
    maxLength: (max: number) => `Máximo de ${max} caracteres`,
    min: (min: number) => `Valor mínimo: ${min}`,
    max: (max: number) => `Valor máximo: ${max}`,
    generic: 'Ocorreu um erro. Tente novamente.',
    network: 'Erro de conexão. Verifique sua internet.',
    unauthorized: 'Você não tem permissão para esta ação.',
    notFound: 'Item não encontrado.',
    serverError: 'Erro no servidor. Tente novamente mais tarde.',
  },

  // ============================================
  // MENSAGENS DE SUCESSO
  // ============================================
  success: {
    saved: 'Salvo com sucesso',
    created: 'Criado com sucesso',
    updated: 'Atualizado com sucesso',
    deleted: 'Excluído com sucesso',
    published: 'Publicado com sucesso',
    unpublished: 'Despublicado com sucesso',
    activated: 'Ativado com sucesso',
    deactivated: 'Desativado com sucesso',
    uploaded: 'Enviado com sucesso',
    exported: 'Exportado com sucesso',
    imported: 'Importado com sucesso',
    passwordChanged: 'Senha alterada com sucesso',
    emailSent: 'E-mail enviado com sucesso',
  },

  // ============================================
  // ESTADOS VAZIOS
  // ============================================
  emptyStates: {
    noResults: 'Nenhum resultado encontrado',
    noData: 'Nenhum dado disponível',
    noItems: 'Nenhum item encontrado',
    noProducts: 'Nenhum produto encontrado',
    noCategories: 'Nenhuma categoria encontrada',
    noOrders: 'Nenhum pedido encontrado',
    noStock: 'Nenhum produto em estoque',
    noUsers: 'Nenhum membro da equipe',
    tryAgain: 'Tente novamente com outros filtros',
    createFirst: 'Crie o primeiro item',
    addFirst: 'Adicione o primeiro item',
  },

  // ============================================
  // LOADING
  // ============================================
  loading: {
    loading: 'Carregando...',
    saving: 'Salvando...',
    deleting: 'Excluindo...',
    processing: 'Processando...',
    pleaseWait: 'Por favor, aguarde...',
    loadingStock: 'Carregando estoque...',
  },

  // ============================================
  // PAGINAÇÃO
  // ============================================
  pagination: {
    previous: 'Anterior',
    next: 'Próxima',
    page: 'Página',
    of: 'de',
    showing: 'Mostrando',
    to: 'até',
    ofTotal: 'de',
    results: 'resultados',
    perPage: 'por página',
  },

  // ============================================
  // FILTROS
  // ============================================
  filters: {
    all: 'Todos',
    active: 'Ativos',
    inactive: 'Inativos',
    published: 'Publicados',
    unpublished: 'Não publicados',
    today: 'Hoje',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mês',
    thisYear: 'Este ano',
    custom: 'Personalizado',
    clear: 'Limpar filtros',
    apply: 'Aplicar filtros',
  },
} as const
