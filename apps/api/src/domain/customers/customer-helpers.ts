/**
 * Remove formatação do CPF (pontos e traços)
 */
export function normalizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Valida se o CPF tem 11 dígitos numéricos
 */
export function isValidCPFLength(cpf: string): boolean {
  const normalized = normalizeCPF(cpf)
  return normalized.length === 11
}

/**
 * Valida se todos os dígitos são iguais (CPF inválido)
 */
function areAllDigitsEqual(cpf: string): boolean {
  return /^(\d)\1{10}$/.test(cpf)
}

/**
 * Calcula o dígito verificador do CPF
 */
function calculateDigit(cpf: string, position: number): number {
  let sum = 0
  let weight = position + 1

  for (let i = 0; i < position; i++) {
    sum += parseInt(cpf[i]) * weight
    weight--
  }

  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

/**
 * Valida CPF brasileiro (formato e dígitos verificadores)
 */
export function validateCPF(cpf: string): boolean {
  const normalized = normalizeCPF(cpf)

  // Verifica se tem 11 dígitos
  if (!isValidCPFLength(normalized)) {
    return false
  }

  // Verifica se todos os dígitos são iguais
  if (areAllDigitsEqual(normalized)) {
    return false
  }

  // Valida primeiro dígito verificador
  const firstDigit = calculateDigit(normalized, 9)
  if (firstDigit !== parseInt(normalized[9])) {
    return false
  }

  // Valida segundo dígito verificador
  const secondDigit = calculateDigit(normalized, 10)
  if (secondDigit !== parseInt(normalized[10])) {
    return false
  }

  return true
}

