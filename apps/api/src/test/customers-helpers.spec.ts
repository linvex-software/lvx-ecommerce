import { describe, it, expect } from 'vitest'
import { normalizeCPF, validateCPF, isValidCPFLength } from '../domain/customers/customer-helpers'

describe('Customer Helpers', () => {
  describe('normalizeCPF', () => {
    it('should remove formatting from CPF', () => {
      expect(normalizeCPF('123.456.789-00')).toBe('12345678900')
      expect(normalizeCPF('12345678900')).toBe('12345678900')
      expect(normalizeCPF('123 456 789 00')).toBe('12345678900')
    })

    it('should handle CPF with only numbers', () => {
      expect(normalizeCPF('11122233344')).toBe('11122233344')
    })
  })

  describe('isValidCPFLength', () => {
    it('should return true for CPF with 11 digits', () => {
      expect(isValidCPFLength('12345678900')).toBe(true)
      expect(isValidCPFLength('123.456.789-00')).toBe(true)
    })

    it('should return false for CPF with wrong length', () => {
      expect(isValidCPFLength('123456789')).toBe(false)
      expect(isValidCPFLength('123456789012')).toBe(false)
      expect(isValidCPFLength('')).toBe(false)
    })
  })

  describe('validateCPF', () => {
    it('should validate correct CPF', () => {
      // CPFs válidos conhecidos
      expect(validateCPF('11144477735')).toBe(true)
      expect(validateCPF('111.444.777-35')).toBe(true)
      expect(validateCPF('12345678909')).toBe(true)
    })

    it('should reject CPF with wrong check digits', () => {
      expect(validateCPF('11144477734')).toBe(false) // Dígito verificador errado
      expect(validateCPF('12345678900')).toBe(false) // Dígito verificador errado
    })

    it('should reject CPF with all same digits', () => {
      expect(validateCPF('11111111111')).toBe(false)
      expect(validateCPF('00000000000')).toBe(false)
      expect(validateCPF('99999999999')).toBe(false)
    })

    it('should reject CPF with wrong length', () => {
      expect(validateCPF('123456789')).toBe(false)
      expect(validateCPF('123456789012')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(validateCPF('')).toBe(false)
    })
  })
})

