/**
 * Mapeia códigos de erro do Mercado Pago para mensagens em português brasileiro
 */
export function getMercadoPagoErrorMessage(statusDetail: string): string {
  const errorMessages: Record<string, string> = {
    // Erros de cartão rejeitado
    'cc_rejected_call_for_authorize': 'Seu cartão precisa de autorização do banco. Entre em contato com seu banco para autorizar o pagamento.',
    'cc_rejected_card_disabled': 'Seu cartão está desabilitado. Entre em contato com seu banco para mais informações.',
    'cc_rejected_card_error': 'Não foi possível processar seu cartão. Verifique os dados e tente novamente.',
    'cc_rejected_duplicated_payment': 'Você já realizou um pagamento com o mesmo valor. Se não foi você, entre em contato conosco.',
    'cc_rejected_high_risk': 'Seu pagamento foi recusado por medidas de segurança. Tente novamente ou use outro método de pagamento.',
    'cc_rejected_insufficient_amount': 'Saldo insuficiente no cartão. Verifique seu saldo e tente novamente.',
    'cc_rejected_invalid_cvv': 'O código de segurança (CVV) está incorreto. Verifique e tente novamente.',
    'cc_rejected_invalid_installments': 'O número de parcelas não é válido para este cartão.',
    'cc_rejected_max_attempts': 'Você excedeu o número máximo de tentativas. Tente novamente em algumas horas.',
    'cc_rejected_other_reason': 'Seu cartão foi recusado. Entre em contato com seu banco para mais informações.',
    'cc_rejected_bad_filled_card_number': 'O número do cartão está incorreto. Verifique e tente novamente.',
    'cc_rejected_bad_filled_date': 'A data de validade está incorreta. Verifique e tente novamente.',
    'cc_rejected_bad_filled_other': 'Alguns dados do cartão estão incorretos. Verifique todos os campos e tente novamente.',
    'cc_rejected_bad_filled_security_code': 'O código de segurança (CVV) está incorreto. Verifique e tente novamente.',
    'cc_rejected_blacklist': 'Não foi possível processar seu pagamento. Entre em contato conosco para mais informações.',
    'cc_rejected_insufficient_data': 'Dados insuficientes para processar o pagamento. Verifique os dados informados.',
    'cc_rejected_insufficient_balance': 'Saldo insuficiente no cartão. Verifique seu saldo e tente novamente.',
    'cc_rejected_invalid_card': 'Cartão inválido. Verifique os dados do cartão e tente novamente.',
    'cc_rejected_invalid_operation': 'Operação inválida. Tente novamente ou use outro método de pagamento.',
    'cc_rejected_mastercard_service_error': 'Erro no serviço do Mastercard. Tente novamente em alguns instantes.',
    'cc_rejected_not_allowed_payment': 'Este tipo de pagamento não é permitido para este cartão.',
    'cc_rejected_restricted_card': 'Cartão com restrições. Entre em contato com seu banco.',
    'cc_rejected_security_code': 'O código de segurança (CVV) está incorreto. Verifique e tente novamente.',
    'cc_rejected_slow_network': 'Erro de conexão. Tente novamente.',
    'cc_rejected_visa_service_error': 'Erro no serviço do Visa. Tente novamente em alguns instantes.',
    
    // Erros gerais
    'rejected': 'Pagamento rejeitado. Verifique os dados e tente novamente.',
    'pending': 'Pagamento pendente. Aguarde a confirmação.',
    'cancelled': 'Pagamento cancelado.',
    'refunded': 'Pagamento reembolsado.',
    'charged_back': 'Pagamento estornado.',
    
    // Erros de processamento
    'processing_error': 'Erro ao processar o pagamento. Tente novamente.',
    'invalid_payment_method': 'Método de pagamento inválido.',
    'invalid_amount': 'Valor inválido.',
    'invalid_payer': 'Dados do pagador inválidos.',
  }

  // Retornar mensagem específica ou genérica
  return errorMessages[statusDetail] || errorMessages[statusDetail.toLowerCase()] || 
         'Não foi possível processar o pagamento. Tente novamente ou entre em contato conosco.'
}

/**
 * Verifica se um statusDetail indica que o usuário precisa tomar alguma ação
 */
export function requiresUserAction(statusDetail: string): boolean {
  const actionRequired = [
    'cc_rejected_call_for_authorize',
    'cc_rejected_card_disabled',
    'cc_rejected_insufficient_amount',
    'cc_rejected_insufficient_balance',
    'cc_rejected_invalid_cvv',
    'cc_rejected_bad_filled_card_number',
    'cc_rejected_bad_filled_date',
    'cc_rejected_bad_filled_security_code',
    'cc_rejected_bad_filled_other',
  ]

  return actionRequired.includes(statusDetail) || actionRequired.includes(statusDetail.toLowerCase())
}












