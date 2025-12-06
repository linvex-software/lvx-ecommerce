import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { createCouponUseCase, createCouponSchema } from '../../../application/coupons/use-cases/create-coupon'
import { updateCouponUseCase, updateCouponSchema } from '../../../application/coupons/use-cases/update-coupon'
import { deleteCouponUseCase } from '../../../application/coupons/use-cases/delete-coupon'
import { listCouponsUseCase } from '../../../application/coupons/use-cases/list-coupons'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'

export class CouponController {
  constructor(private readonly couponRepository: CouponRepository) {}

  async list(request: FastifyRequest<{ Querystring: { active?: string } }>, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const active = request.query.active === 'true' ? true : request.query.active === 'false' ? false : undefined

      const coupons = await listCouponsUseCase(
        storeId,
        { active },
        {
          couponRepository: this.couponRepository
        }
      )

      await reply.send({ coupons })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const validated = createCouponSchema.parse(request.body)

      const coupon = await createCouponUseCase(validated, storeId, {
        couponRepository: this.couponRepository
      })

      await reply.code(201).send({ coupon })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode = error.message.includes('already exists') ? 409 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params
      const validated = updateCouponSchema.parse(request.body)

      const coupon = await updateCouponUseCase(id, storeId, validated, {
        couponRepository: this.couponRepository
      })

      await reply.send({ coupon })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode = error.message === 'Coupon not found' ? 404 : error.message.includes('already exists') ? 409 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params

      await deleteCouponUseCase(id, storeId, {
        couponRepository: this.couponRepository
      })

      await reply.code(204).send()
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Coupon not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

