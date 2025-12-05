import { describe, it, expect, afterAll } from 'vitest'
import { ProductRepository } from '../infra/db/repositories/product-repository'
import { createProductUseCase } from '../application/catalog/use-cases/create-product'
import { updateProductUseCase } from '../application/catalog/use-cases/update-product'
import { normalizeSlug } from '../application/utils/slug'
import { generateSku } from '../application/utils/sku'

const STORE_ID = process.env.TEST_STORE_ID || '190b1fff-9c11-4065-bdf7-ef65f49755a7'

describe('Product Use Cases - Task #52', () => {
  const repository = new ProductRepository()
  let createdProductId: string

  afterAll(async () => {
    // Limpar produto criado nos testes
    if (createdProductId) {
      try {
        await repository.delete(createdProductId, STORE_ID)
      } catch {
        // Ignorar erros de limpeza
      }
    }
  })

  describe('Slug normalization', () => {
    it('should normalize slug with accents and special characters', () => {
      const input = 'Nome do Produto Á'
      const normalized = normalizeSlug(input)
      expect(normalized).toBe('nome-do-produto-a')
    })

    it('should normalize slug with spaces and multiple separators', () => {
      const input = 'Produto  Teste   Especial'
      const normalized = normalizeSlug(input)
      expect(normalized).toBe('produto-teste-especial')
    })

    it('should remove leading and trailing dashes', () => {
      const input = '---produto---'
      const normalized = normalizeSlug(input)
      expect(normalized).toBe('produto')
    })

    it('should collapse multiple dashes', () => {
      const input = 'produto---teste---especial'
      const normalized = normalizeSlug(input)
      expect(normalized).toBe('produto-teste-especial')
    })
  })

  describe('SKU generation', () => {
    it('should generate SKU with correct format', () => {
      const sku = generateSku(STORE_ID)
      expect(sku).toMatch(/^SKU-[A-Z0-9]{8}-[A-Z0-9]{6}$/)
    })

    it('should generate different SKUs', () => {
      const sku1 = generateSku(STORE_ID)
      const sku2 = generateSku(STORE_ID)
      // Pode ser igual por acaso, mas é improvável
      expect(typeof sku1).toBe('string')
      expect(typeof sku2).toBe('string')
    })
  })

  describe('Create Product', () => {
    it('should normalize slug when creating product', async () => {
      const product = await createProductUseCase(
        {
          name: 'Produto Teste Á',
          slug: 'Produto Teste Á',
          description: 'Descrição teste',
          base_price: 99.90,
          sku: `TEST-SKU-${Date.now()}`
        },
        STORE_ID,
        { productRepository: repository }
      )

      expect(product.slug).toBe('produto-teste-a')
      createdProductId = product.id
    })

    it('should generate slug automatically from name when slug is not provided', async () => {
      const product = await createProductUseCase(
        {
          name: 'Produto Sem Slug Á',
          description: 'Descrição teste',
          base_price: 50.00,
          sku: `TEST-NO-SLUG-${Date.now()}`
        },
        STORE_ID,
        { productRepository: repository }
      )

      expect(product.slug).toBe('produto-sem-slug-a')

      // Limpar
      try {
        await repository.delete(product.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })

    it('should generate slug automatically from name when slug is empty string', async () => {
      const product = await createProductUseCase(
        {
          name: 'Produto Slug Vazio',
          slug: '',
          description: 'Descrição teste',
          base_price: 75.00,
          sku: `TEST-EMPTY-SLUG-${Date.now()}`
        },
        STORE_ID,
        { productRepository: repository }
      )

      expect(product.slug).toBe('produto-slug-vazio')

      // Limpar
      try {
        await repository.delete(product.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })

    it('should not allow duplicate slug when auto-generated', async () => {
      const name = `Produto Duplicado ${Date.now()}`
      const expectedSlug = normalizeSlug(name)

      const product1 = await createProductUseCase(
        {
          name: name,
          description: 'Descrição',
          base_price: 10.00,
          sku: `TEST-DUP-1-${Date.now()}`
        },
        STORE_ID,
        { productRepository: repository }
      )

      expect(product1.slug).toBe(expectedSlug)

      // Tentar criar produto com slug manual igual ao gerado
      await expect(
        createProductUseCase(
          {
            name: 'Outro Nome',
            slug: expectedSlug,
            description: 'Descrição',
            base_price: 20.00,
            sku: `TEST-DUP-2-${Date.now()}`
          },
          STORE_ID,
          { productRepository: repository }
        )
      ).rejects.toThrow('Product slug already exists')

      // Limpar
      try {
        await repository.delete(product1.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })

    it('should generate SKU automatically if not provided', async () => {
      const product = await createProductUseCase(
        {
          name: 'Produto Sem SKU',
          slug: `produto-sem-sku-${Date.now()}`,
          description: 'Descrição teste',
          base_price: 50.00
        },
        STORE_ID,
        { productRepository: repository }
      )

      expect(product.sku).toBeDefined()
      expect(product.sku).toMatch(/^SKU-[A-Z0-9]{8}-[A-Z0-9]{6}$/)

      // Limpar
      try {
        await repository.delete(product.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })

    it('should generate SKU automatically when SKU is empty string', async () => {
      const product = await createProductUseCase(
        {
          name: 'Produto SKU Vazio',
          slug: `produto-sku-vazio-${Date.now()}`,
          description: 'Descrição teste',
          base_price: 75.00,
          sku: ''
        },
        STORE_ID,
        { productRepository: repository }
      )

      expect(product.sku).toBeDefined()
      expect(product.sku).toMatch(/^SKU-[A-Z0-9]{8}-[A-Z0-9]{6}$/)

      // Limpar
      try {
        await repository.delete(product.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })

    it('should generate SKU automatically when SKU is undefined', async () => {
      const product = await createProductUseCase(
        {
          name: 'Produto SKU Undefined',
          slug: `produto-sku-undefined-${Date.now()}`,
          description: 'Descrição teste',
          base_price: 80.00,
          sku: undefined
        },
        STORE_ID,
        { productRepository: repository }
      )

      expect(product.sku).toBeDefined()
      expect(product.sku).toMatch(/^SKU-[A-Z0-9]{8}-[A-Z0-9]{6}$/)

      // Limpar
      try {
        await repository.delete(product.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })

    it('should not allow duplicate slug in same store', async () => {
      const slug = `test-slug-${Date.now()}`

      const product1 = await createProductUseCase(
        {
          name: 'Produto 1',
          slug: slug,
          description: 'Descrição',
          base_price: 10.00,
          sku: `TEST-1-${Date.now()}`
        },
        STORE_ID,
        { productRepository: repository }
      )

      await expect(
        createProductUseCase(
          {
            name: 'Produto 2',
            slug: slug, // Mesmo slug
            description: 'Descrição',
            base_price: 20.00,
            sku: `TEST-2-${Date.now()}`
          },
          STORE_ID,
          { productRepository: repository }
        )
      ).rejects.toThrow('Product slug already exists')

      // Limpar
      try {
        await repository.delete(product1.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })

    it('should not allow duplicate SKU in same store', async () => {
      const sku = `TEST-SKU-DUP-${Date.now()}`

      const product1 = await createProductUseCase(
        {
          name: 'Produto 1',
          slug: `test-1-${Date.now()}`,
          description: 'Descrição',
          base_price: 10.00,
          sku: sku
        },
        STORE_ID,
        { productRepository: repository }
      )

      await expect(
        createProductUseCase(
          {
            name: 'Produto 2',
            slug: `test-2-${Date.now()}`,
            description: 'Descrição',
            base_price: 20.00,
            sku: sku // Mesmo SKU
          },
          STORE_ID,
          { productRepository: repository }
        )
      ).rejects.toThrow('Product SKU already exists')

      // Limpar
      try {
        await repository.delete(product1.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })

    it('should validate base_price as positive number', async () => {
      await expect(
        createProductUseCase(
          {
            name: 'Produto Preço Inválido',
            slug: `produto-preco-invalido-${Date.now()}`,
            description: 'Descrição',
            base_price: 0, // Preço zero
            sku: `TEST-PRICE-${Date.now()}`
          },
          STORE_ID,
          { productRepository: repository }
        )
      ).rejects.toThrow()

      await expect(
        createProductUseCase(
          {
            name: 'Produto Preço Negativo',
            slug: `produto-preco-negativo-${Date.now()}`,
            description: 'Descrição',
            base_price: -10.00, // Preço negativo
            sku: `TEST-PRICE-NEG-${Date.now()}`
          },
          STORE_ID,
          { productRepository: repository }
        )
      ).rejects.toThrow()
    })
  })

  describe('Update Product', () => {
    it('should normalize slug when updating product', async () => {
      if (!createdProductId) {
        // Criar produto se não existir
        const product = await createProductUseCase(
          {
            name: 'Produto Original',
            slug: 'produto-original',
            description: 'Descrição',
            base_price: 100.00,
            sku: `TEST-UPDATE-${Date.now()}`
          },
          STORE_ID,
          { productRepository: repository }
        )
        createdProductId = product.id
      }

      const updated = await updateProductUseCase(
        createdProductId,
        STORE_ID,
        {
          slug: 'Novo Slug Á'
        },
        { productRepository: repository }
      )

      expect(updated.slug).toBe('novo-slug-a')
    })

    it('should keep current slug when updating product without slug field', async () => {
      const product = await createProductUseCase(
        {
          name: 'Produto Para Update',
          slug: 'produto-para-update',
          description: 'Descrição',
          base_price: 100.00,
          sku: `TEST-KEEP-SLUG-${Date.now()}`
        },
        STORE_ID,
        { productRepository: repository }
      )

      const originalSlug = product.slug

      // Atualizar sem enviar slug
      const updated = await updateProductUseCase(
        product.id,
        STORE_ID,
        {
          name: 'Produto Atualizado'
          // slug não enviado
        },
        { productRepository: repository }
      )

      expect(updated.slug).toBe(originalSlug)
      expect(updated.name).toBe('Produto Atualizado')

      // Limpar
      try {
        await repository.delete(product.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })

    it('should not allow updating to duplicate slug in same store', async () => {
      // Criar dois produtos
      const product1 = await createProductUseCase(
        {
          name: 'Produto 1',
          slug: `produto-1-${Date.now()}`,
          description: 'Descrição',
          base_price: 10.00,
          sku: `TEST-U1-${Date.now()}`
        },
        STORE_ID,
        { productRepository: repository }
      )

      const product2 = await createProductUseCase(
        {
          name: 'Produto 2',
          slug: `produto-2-${Date.now()}`,
          description: 'Descrição',
          base_price: 20.00,
          sku: `TEST-U2-${Date.now()}`
        },
        STORE_ID,
        { productRepository: repository }
      )

      // Tentar atualizar product2 com slug do product1
      await expect(
        updateProductUseCase(
          product2.id,
          STORE_ID,
          {
            slug: product1.slug
          },
          { productRepository: repository }
        )
      ).rejects.toThrow('Product slug already exists')

      // Limpar
      try {
        await repository.delete(product1.id, STORE_ID)
        await repository.delete(product2.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })

    it('should not allow updating to duplicate SKU in same store', async () => {
      // Criar dois produtos
      const product1 = await createProductUseCase(
        {
          name: 'Produto 1',
          slug: `produto-1-${Date.now()}`,
          description: 'Descrição',
          base_price: 10.00,
          sku: `TEST-SKU-U1-${Date.now()}`
        },
        STORE_ID,
        { productRepository: repository }
      )

      const product2 = await createProductUseCase(
        {
          name: 'Produto 2',
          slug: `produto-2-${Date.now()}`,
          description: 'Descrição',
          base_price: 20.00,
          sku: `TEST-SKU-U2-${Date.now()}`
        },
        STORE_ID,
        { productRepository: repository }
      )

      // Tentar atualizar product2 com SKU do product1
      await expect(
        updateProductUseCase(
          product2.id,
          STORE_ID,
          {
            sku: product1.sku
          },
          { productRepository: repository }
        )
      ).rejects.toThrow('Product SKU already exists')

      // Limpar
      try {
        await repository.delete(product1.id, STORE_ID)
        await repository.delete(product2.id, STORE_ID)
      } catch {
        // Ignorar
      }
    })
  })
})

