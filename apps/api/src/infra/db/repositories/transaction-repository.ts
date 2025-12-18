import { db, schema } from '@white-label/db'
import { eq, and } from 'drizzle-orm'

export interface Transaction {
  id: string
  order_id: string
  store_id: string
  payment_method_id: string
  amount: string
  status: string
  provider_transaction_id: string | null
  created_at: Date
}

export interface CreateTransactionInput {
  order_id: string
  store_id: string
  payment_method_id: string
  amount: number // em centavos
  status: string
  provider_transaction_id?: string | null
}

export class TransactionRepository {
  async create(input: CreateTransactionInput): Promise<Transaction> {
    // Converter centavos para reais (banco espera valores em reais com 2 casas decimais)
    const [transaction] = await db
      .insert(schema.transactions)
      .values({
        order_id: input.order_id,
        store_id: input.store_id,
        payment_method_id: input.payment_method_id,
        amount: (input.amount / 100).toFixed(2), // Converter centavos para reais
        status: input.status,
        provider_transaction_id: input.provider_transaction_id ?? null
      })
      .returning()

    return {
      id: transaction.id,
      order_id: transaction.order_id,
      store_id: transaction.store_id,
      payment_method_id: transaction.payment_method_id,
      amount: transaction.amount,
      status: transaction.status,
      provider_transaction_id: transaction.provider_transaction_id,
      created_at: transaction.created_at
    }
  }

  async findByOrderId(orderId: string, storeId: string): Promise<Transaction | null> {
    const [transaction] = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.order_id, orderId),
          eq(schema.transactions.store_id, storeId)
        )
      )
      .limit(1)

    if (!transaction) {
      return null
    }

    return {
      id: transaction.id,
      order_id: transaction.order_id,
      store_id: transaction.store_id,
      payment_method_id: transaction.payment_method_id,
      amount: transaction.amount,
      status: transaction.status,
      provider_transaction_id: transaction.provider_transaction_id,
      created_at: transaction.created_at
    }
  }

  async updateStatus(
    transactionId: string,
    storeId: string,
    status: string,
    providerTransactionId?: string | null
  ): Promise<void> {
    await db
      .update(schema.transactions)
      .set({
        status,
        provider_transaction_id: providerTransactionId ?? undefined
      })
      .where(
        and(
          eq(schema.transactions.id, transactionId),
          eq(schema.transactions.store_id, storeId)
        )
      )
  }

  async findByProviderTransactionId(
    providerTransactionId: string,
    storeId: string
  ): Promise<Transaction | null> {
    const [transaction] = await db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.provider_transaction_id, providerTransactionId),
          eq(schema.transactions.store_id, storeId)
        )
      )
      .limit(1)

    if (!transaction) {
      return null
    }

    return {
      id: transaction.id,
      order_id: transaction.order_id,
      store_id: transaction.store_id,
      payment_method_id: transaction.payment_method_id,
      amount: transaction.amount,
      status: transaction.status,
      provider_transaction_id: transaction.provider_transaction_id,
      created_at: transaction.created_at
    }
  }
}


