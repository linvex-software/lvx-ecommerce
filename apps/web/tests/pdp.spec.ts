import { test, expect } from '@playwright/test'

const STORE_ID = '190b1fff-9c11-4065-bdf7-ef65f49755a7'

test.describe('PDP E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar store ID no localStorage
    await page.goto('/')
    await page.evaluate((storeId) => {
      localStorage.setItem('storeId', storeId)
    }, STORE_ID)
  })

  test.describe('Cenário 1 - PDP com estoque = 0 (ESGOTADO)', () => {
    test('should display product with out of stock status', async ({ page }) => {
      await page.goto('/products/oculos-de-sol-aviador')

      // Aguardar carregamento
      await page.waitForSelector('h1', { timeout: 10000 })

      // Verificar nome do produto
      const productName = page.locator('h1').first()
      await expect(productName).toBeVisible()
      await expect(productName).toContainText('Óculos')

      // Verificar preço (pode estar em diferentes formatos)
      const price = page.locator('text=/179/').or(page.locator('text=/R\\$/')).first()
      await expect(price).toBeVisible({ timeout: 10000 })

      // Verificar descrição
      const description = page.locator('text=/Óculos/i').or(page.locator('text=/aviador/i'))
      await expect(description.first()).toBeVisible({ timeout: 10000 })

      // Verificar imagem principal
      const mainImage = page.locator('img').first()
      await expect(mainImage).toBeVisible()

      // Verificar que NÃO exibe "Estoque: X unidades"
      const stockText = page.locator('text=/Estoque:.*unidades/')
      await expect(stockText).not.toBeVisible()

      // Verificar badge ESGOTADO (pode estar em diferentes formatos)
      const esgotadoBadge = page.locator('text=/ESGOTADO/i').or(page.locator('text=/Esgotado/i')).or(page.locator('[class*="destructive"]'))
      await expect(esgotadoBadge.first()).toBeVisible({ timeout: 10000 })

      // Verificar botão desabilitado
      const addToCartButton = page.locator('button:has-text("Esgotado")').or(page.locator('button:has-text("Adicionar ao carrinho")'))
      await expect(addToCartButton).toBeDisabled()

      // Verificar que botão desabilitado não permite clique
      // (não vamos tentar clicar pois está desabilitado - isso já foi validado acima)
    })
  })

  test.describe('Cenário 2 - PDP com estoque > 0', () => {
    test('should display product with stock and enable add to cart', async ({ page }) => {
      await page.goto('/products/tenis-urbano-minimalista')

      // Aguardar carregamento
      await page.waitForSelector('h1', { timeout: 10000 })

      // Verificar campos básicos
      const productName = page.locator('h1').first()
      await expect(productName).toBeVisible()

      const price = page.locator('text=/299/').or(page.locator('text=/R\\$/')).first()
      await expect(price).toBeVisible({ timeout: 10000 })

      const description = page.locator('text=/Tênis/i').or(page.locator('text=/minimalista/i'))
      await expect(description.first()).toBeVisible({ timeout: 10000 })

      const mainImage = page.locator('img').first()
      await expect(mainImage).toBeVisible()

      // Verificar estoque > 0
      const stockText = page.locator('text=/Estoque:.*unidades/')
      await expect(stockText).toBeVisible()
      const stockContent = await stockText.textContent()
      expect(stockContent).toMatch(/Estoque:.*[1-9]/)

      // Verificar que NÃO exibe ESGOTADO
      const esgotadoBadge = page.locator('text=ESGOTADO')
      await expect(esgotadoBadge).not.toBeVisible()

      // Verificar botão habilitado
      const addToCartButton = page.locator('button:has-text("Adicionar ao carrinho")')
      await expect(addToCartButton).toBeEnabled()

      // Testar adicionar ao carrinho
      await addToCartButton.click()
      await page.waitForTimeout(1000)

      // Verificar que carrinho abre (pode ser sidebar ou modal)
      const cart = page.locator('[role="dialog"]').or(page.locator('text=/carrinho/i')).or(page.locator('[aria-label*="cart"]'))
      await expect(cart.first()).toBeVisible({ timeout: 3000 })

      // Verificar item no carrinho
      const cartItem = page.locator('text=/Tênis/').or(page.locator('text=/tenis/i'))
      await expect(cartItem.first()).toBeVisible({ timeout: 2000 })
    })
  })

  test.describe('Cenário 3 - Tabela de medidas', () => {
    test('should handle size chart if present or not break if absent', async ({ page }) => {
      await page.goto('/products/oculos-de-sol-aviador')

      await page.waitForSelector('h1', { timeout: 10000 })

      // Verificar se existe tabela de medidas
      const sizeChartSection = page.locator('text=/Tabela de medidas/i').or(page.locator('text=/medidas/i'))
      const hasSizeChart = await sizeChartSection.count() > 0

      if (hasSizeChart) {
        // Se existe, verificar estrutura da tabela
        const table = page.locator('table').first()
        await expect(table).toBeVisible()

        const tableRows = table.locator('tr')
        const rowCount = await tableRows.count()
        expect(rowCount).toBeGreaterThan(0)

        const tableHeaders = table.locator('th')
        const headerCount = await tableHeaders.count()
        expect(headerCount).toBeGreaterThan(0)
      } else {
        // Se não existe, verificar que página não quebrou
        const productName = page.locator('h1').first()
        await expect(productName).toBeVisible()
        // Página deve estar renderizada normalmente
      }
    })
  })

  test.describe('Cenário 4 - Botão "Descobrir meu tamanho"', () => {
    test('should show virtual try-on button if data exists or hide if not', async ({ page }) => {
      await page.goto('/products/oculos-de-sol-aviador')

      await page.waitForSelector('h1', { timeout: 10000 })

      const tryOnButton = page.locator('button:has-text("Descobrir meu tamanho")').or(page.locator('button:has-text("tamanho")'))
      const hasTryOnButton = await tryOnButton.count() > 0

      if (hasTryOnButton) {
        // Se existe, testar modal
        await expect(tryOnButton.first()).toBeVisible()
        await tryOnButton.first().click()

        // Verificar modal aberto
        const modal = page.locator('[role="dialog"]').or(page.locator('text=/Provador Virtual/i'))
        await expect(modal.first()).toBeVisible({ timeout: 2000 })

        // Testar fechar com X
        const closeButton = page.locator('button[aria-label*="Fechar"]').or(page.locator('button:has-text("X")')).or(page.locator('button:has-text("×")'))
        if (await closeButton.count() > 0) {
          await closeButton.first().click()
          await page.waitForTimeout(500)
          await expect(modal.first()).not.toBeVisible()
        }

        // Reabrir modal
        await tryOnButton.first().click()
        await page.waitForTimeout(500)

        // Testar fechar com ESC
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
        await expect(modal.first()).not.toBeVisible()
      } else {
        // Se não existe, verificar que página não quebrou
        const productName = page.locator('h1').first()
        await expect(productName).toBeVisible()
      }
    })
  })

  test.describe('Cenário 5 - Produtos relacionados', () => {
    test('should display related products and navigate correctly', async ({ page }) => {
      await page.goto('/products/oculos-de-sol-aviador')

      await page.waitForSelector('h1', { timeout: 10000 })

      // Verificar seção de relacionados
      const relatedSection = page.locator('text=/Você também pode gostar/i').or(page.locator('text=/relacionados/i'))
      const hasRelated = await relatedSection.count() > 0

      if (hasRelated) {
        await expect(relatedSection.first()).toBeVisible()

        // Verificar que produto atual não aparece
        const currentProduct = page.locator('text=/Óculos de Sol Aviador/i')
        const relatedProducts = page.locator('[data-testid*="product"]').or(page.locator('article')).or(page.locator('a[href*="/products/"]'))
        const relatedCount = await relatedProducts.count()

        if (relatedCount > 0) {
          // Clicar no primeiro produto relacionado
          const firstRelated = relatedProducts.first()
          const href = await firstRelated.getAttribute('href')

          if (href && href.includes('/products/')) {
            await firstRelated.click()
            await page.waitForURL(/\/products\/.*/, { timeout: 5000 })

            // Verificar que navegou para outra PDP
            const newProductName = page.locator('h1').first()
            await expect(newProductName).toBeVisible()
            const newName = await newProductName.textContent()
            expect(newName).not.toContain('Óculos de Sol Aviador')
          }
        }
      } else {
        // Se não há relacionados, página não deve quebrar
        const productName = page.locator('h1').first()
        await expect(productName).toBeVisible()
      }
    })
  })

  test.describe('Cenário 6 - Reviews (placeholder)', () => {
    test('should display reviews placeholder section', async ({ page }) => {
      await page.goto('/products/oculos-de-sol-aviador')

      await page.waitForSelector('h1', { timeout: 10000 })

      // Verificar seção de avaliações
      const reviewsSection = page.locator('text=/Avaliações/i').or(page.locator('text=/reviews/i'))
      await expect(reviewsSection.first()).toBeVisible({ timeout: 3000 })

      // Verificar placeholder
      const placeholder = page.locator('text=/Em breve/i').or(page.locator('text=/em breve/i'))
      await expect(placeholder.first()).toBeVisible()
    })
  })

  test.describe('Cenário 7 - Slug inválido', () => {
    test('should show 404 or error message for invalid slug', async ({ page }) => {
      await page.goto('/products/slug-que-nao-existe-123')

      // Aguardar resposta
      await page.waitForTimeout(2000)

      // Verificar que não mostra stack trace visível ao usuário
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).not.toContain('at ')
      expect(bodyText).not.toContain('Error:')
      // "stack" pode aparecer no código JS, mas não no texto visível

      // Verificar mensagem de erro ou 404
      const errorMessage = page.locator('text=/não encontrado/i').or(page.locator('text=/404/i')).or(page.locator('text=/Not Found/i'))
      await expect(errorMessage.first()).toBeVisible({ timeout: 3000 })
    })
  })
})

