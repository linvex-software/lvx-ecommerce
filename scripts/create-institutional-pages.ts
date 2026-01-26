import 'dotenv/config'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'

/**
 * Script para criar páginas institucionais iniciais (FAQ e Política de Troca)
 * 
 * Uso:
 *   pnpm tsx scripts/create-institutional-pages.ts [storeId]
 * 
 * Se storeId não for fornecido, será usado o primeiro store encontrado
 */

interface PageData {
  title: string
  slug: string
  published: boolean
  contentJson: Record<string, unknown> | null
}

const FAQ_CONTENT: PageData = {
  title: 'Perguntas Frequentes',
  slug: 'faq',
  published: true,
  contentJson: {
    ROOT: {
      type: { resolvedName: 'div' },
      isCanvas: true,
      props: {},
      displayName: 'div',
      custom: {},
      parent: null,
      nodes: ['faq-component'],
      linkedNodes: {},
    },
    'faq-component': {
      type: { resolvedName: 'FAQ' },
      isCanvas: false,
      props: {
        title: 'Perguntas Frequentes',
        items: [
          {
            question: 'Como faço para comprar?',
            answer: 'Você pode comprar diretamente pelo site adicionando os produtos ao carrinho e finalizando o pedido. Também aceitamos pedidos via WhatsApp e atendimento presencial em nossa loja física.',
          },
          {
            question: 'Quais formas de pagamento vocês aceitam?',
            answer: 'Aceitamos cartão de crédito, cartão de débito, PIX e boleto bancário. Para pedidos online, todas as opções estão disponíveis no checkout.',
          },
          {
            question: 'Qual o prazo de entrega?',
            answer: 'O prazo de entrega varia conforme a região e o método de envio escolhido. Geralmente, entregas em Maceió levam de 1 a 3 dias úteis. Para outras cidades, o prazo pode variar de 5 a 15 dias úteis.',
          },
          {
            question: 'Como funciona a troca ou devolução?',
            answer: 'Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução. O produto deve estar em perfeito estado, com etiquetas e embalagem originais. Consulte nossa Política de Troca para mais detalhes.',
          },
          {
            question: 'Vocês fazem entregas para todo o Brasil?',
            answer: 'Sim! Fazemos entregas para todo o território nacional através dos Correios e transportadoras parceiras. O frete é calculado automaticamente no checkout.',
          },
        ],
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderRadius: 8,
        padding: 24,
        margin: 0,
      },
      displayName: 'FAQ',
      custom: {},
      parent: 'ROOT',
      nodes: [],
      linkedNodes: {},
    },
  },
}

const POLITICA_TROCA_CONTENT: PageData = {
  title: 'Política de Troca e Devolução',
  slug: 'politica-troca',
  published: true,
  contentJson: {
    ROOT: {
      type: { resolvedName: 'div' },
      isCanvas: true,
      props: {},
      displayName: 'div',
      custom: {},
      nodes: ['politica-title', 'politica-intro', 'politica-section-1', 'politica-section-2', 'politica-section-3'],
      linkedNodes: {},
    },
    'politica-title': {
      type: { resolvedName: 'TextBlock' },
      isCanvas: false,
      props: {
        content: '<h1 class="font-display text-4xl lg:text-5xl text-foreground mb-4">Política de Troca e Devolução</h1>',
        align: 'left',
        size: 'lg',
      },
      displayName: 'TextBlock',
      custom: {},
      parent: 'ROOT',
      nodes: [],
      linkedNodes: {},
    },
    'politica-intro': {
      type: { resolvedName: 'TextBlock' },
      isCanvas: false,
      props: {
        content: '<p class="text-muted-foreground font-body text-lg mb-8">Garantimos sua satisfação! Conheça nossa política completa de trocas e devoluções.</p>',
        align: 'left',
        size: 'md',
      },
      displayName: 'TextBlock',
      custom: {},
      parent: 'ROOT',
      nodes: [],
      linkedNodes: {},
    },
    'politica-section-1': {
      type: { resolvedName: 'TextBlock' },
      isCanvas: false,
      props: {
        content: '<div class="mb-8"><h2 class="font-display text-2xl text-foreground mb-4">Prazo para Troca ou Devolução</h2><p class="text-muted-foreground font-body leading-relaxed">Você tem até 7 (sete) dias corridos, contados a partir da data de recebimento do produto, para solicitar a troca ou devolução. O produto deve estar em perfeito estado, sem uso, com todas as etiquetas e embalagens originais.</p></div>',
        align: 'left',
        size: 'md',
      },
      displayName: 'TextBlock',
      custom: {},
      parent: 'ROOT',
      nodes: [],
      linkedNodes: {},
    },
    'politica-section-2': {
      type: { resolvedName: 'TextBlock' },
      isCanvas: false,
      props: {
        content: '<div class="mb-8"><h2 class="font-display text-2xl text-foreground mb-4">Como Solicitar Troca ou Devolução</h2><p class="text-muted-foreground font-body leading-relaxed mb-4">Para solicitar troca ou devolução, entre em contato conosco através do WhatsApp, e-mail ou telefone informando o número do pedido e o motivo da solicitação. Nossa equipe irá orientá-lo sobre o processo.</p><p class="text-muted-foreground font-body leading-relaxed">Após a aprovação, você receberá um código de postagem para enviar o produto de volta. O frete de retorno será por conta do cliente, exceto em casos de produtos com defeito ou erro de envio.</p></div>',
        align: 'left',
        size: 'md',
      },
      displayName: 'TextBlock',
      custom: {},
      parent: 'ROOT',
      nodes: [],
      linkedNodes: {},
    },
    'politica-section-3': {
      type: { resolvedName: 'TextBlock' },
      isCanvas: false,
      props: {
        content: '<div class="mb-8"><h2 class="font-display text-2xl text-foreground mb-4">Reembolso</h2><p class="text-muted-foreground font-body leading-relaxed">O reembolso será processado na mesma forma de pagamento utilizada na compra. Para cartão de crédito, o estorno pode levar até 2 faturas. Para PIX, o reembolso é imediato após a confirmação do recebimento do produto.</p></div>',
        align: 'left',
        size: 'md',
      },
      displayName: 'TextBlock',
      custom: {},
      parent: 'ROOT',
      nodes: [],
      linkedNodes: {},
    },
  },
}

async function createInstitutionalPages() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não encontrado no arquivo .env')
    process.exit(1)
  }

  const storeIdArg = process.argv[2]

  console.log('🔧 Criando páginas institucionais...\n')

  try {
    let storeId: string

    if (storeIdArg) {
      storeId = storeIdArg
      console.log(`📦 Usando storeId fornecido: ${storeId}\n`)
    } else {
      // Buscar primeiro store
      const stores = await db.select().from(schema.stores).limit(1)
      if (stores.length === 0) {
        console.error('❌ Nenhuma loja encontrada no banco de dados.')
        console.error('   Crie uma loja primeiro ou forneça o storeId como argumento.')
        process.exit(1)
      }
      storeId = stores[0].id
      console.log(`📦 Usando primeira loja encontrada: ${storeId}\n`)
    }

    // Verificar se as páginas já existem
    const existingPages = await db
      .select()
      .from(schema.landingPages)
      .where(eq(schema.landingPages.store_id, storeId))

    const existingSlugs = existingPages.map(p => p.slug)

    // Criar FAQ
    if (existingSlugs.includes('faq')) {
      console.log('⚠️  Página FAQ já existe. Pulando...')
    } else {
      console.log('📄 Criando página: Perguntas Frequentes (faq)...')
      await db.insert(schema.landingPages).values({
        store_id: storeId,
        title: FAQ_CONTENT.title,
        slug: FAQ_CONTENT.slug,
        published: FAQ_CONTENT.published,
        content_json: FAQ_CONTENT.contentJson as any,
      })
      console.log('✅ Página FAQ criada com sucesso!')
    }

    // Criar Política de Troca
    if (existingSlugs.includes('politica-troca')) {
      console.log('⚠️  Página Política de Troca já existe. Pulando...')
    } else {
      console.log('📄 Criando página: Política de Troca e Devolução (politica-troca)...')
      await db.insert(schema.landingPages).values({
        store_id: storeId,
        title: POLITICA_TROCA_CONTENT.title,
        slug: POLITICA_TROCA_CONTENT.slug,
        published: POLITICA_TROCA_CONTENT.published,
        content_json: POLITICA_TROCA_CONTENT.contentJson as any,
      })
      console.log('✅ Página Política de Troca criada com sucesso!')
    }

    console.log('\n✅ Processo concluído!')
    console.log('\n📋 Páginas disponíveis:')
    console.log('   - /faq - Perguntas Frequentes')
    console.log('   - /politica-troca - Política de Troca e Devolução')
    console.log('\n💡 As páginas podem ser editadas no Admin → Editor → Páginas')
  } catch (error) {
    console.error('❌ Erro ao criar páginas:', error)
    process.exit(1)
  }
}

createInstitutionalPages()
