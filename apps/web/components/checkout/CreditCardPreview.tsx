'use client'

import { useEffect, useState } from 'react'

interface CreditCardPreviewProps {
  cardNumber?: string
  cardholderName?: string
  expirationDate?: string
  paymentMethodId?: string
  issuerName?: string
}

export function CreditCardPreview({
  cardNumber = '',
  cardholderName = '',
  expirationDate = '',
  paymentMethodId = '',
  issuerName = ''
}: CreditCardPreviewProps) {
  const [formattedNumber, setFormattedNumber] = useState('•••• •••• •••• ••••')
  const [formattedName, setFormattedName] = useState('SEU NOME')
  const [formattedDate, setFormattedDate] = useState('MM/AA')

  useEffect(() => {
    if (cardNumber && cardNumber.length >= 4) {
      // Mostrar primeiros dígitos e mascarar o resto
      const first4 = cardNumber.substring(0, 4)
      const remaining = cardNumber.substring(4)
      
      if (cardNumber.length <= 4) {
        setFormattedNumber(`${first4} •••• •••• ••••`)
      } else if (cardNumber.length <= 8) {
        const second4 = cardNumber.substring(4, 8).padEnd(4, '•')
        setFormattedNumber(`${first4} ${second4} •••• ••••`)
      } else if (cardNumber.length <= 12) {
        const second4 = cardNumber.substring(4, 8)
        const third4 = cardNumber.substring(8, 12).padEnd(4, '•')
        setFormattedNumber(`${first4} ${second4} ${third4} ••••`)
      } else {
        const second4 = cardNumber.substring(4, 8)
        const third4 = cardNumber.substring(8, 12)
        const last4 = cardNumber.length >= 16 ? cardNumber.substring(12, 16) : cardNumber.substring(12).padEnd(4, '•')
        setFormattedNumber(`${first4} ${second4} ${third4} ${last4}`)
      }
    } else {
      setFormattedNumber('•••• •••• •••• ••••')
    }
  }, [cardNumber])

  useEffect(() => {
    setFormattedName(cardholderName.toUpperCase() || 'SEU NOME')
  }, [cardholderName])

  useEffect(() => {
    if (expirationDate) {
      // Formato esperado: MM/YY ou MM/YYYY
      const cleaned = expirationDate.replace(/\D/g, '')
      if (cleaned.length >= 4) {
        const month = cleaned.substring(0, 2)
        const year = cleaned.substring(2, 4)
        setFormattedDate(`${month}/${year}`)
      } else if (cleaned.length >= 2) {
        setFormattedDate(`${cleaned.substring(0, 2)}/••`)
      } else {
        setFormattedDate('MM/AA')
      }
    } else {
      setFormattedDate('MM/AA')
    }
  }, [expirationDate])

  // Detectar bandeira do cartão pelos primeiros dígitos
  const getCardBrand = () => {
    if (!cardNumber) return 'unknown'
    
    const firstDigit = cardNumber[0]
    const firstTwo = cardNumber.substring(0, 2)
    const firstFour = cardNumber.substring(0, 4)

    // Visa
    if (firstDigit === '4') return 'visa'
    
    // Mastercard
    if (parseInt(firstTwo) >= 51 && parseInt(firstTwo) <= 55) return 'mastercard'
    if (parseInt(firstTwo) === 22 && parseInt(firstFour) >= 2221 && parseInt(firstFour) <= 2720) return 'mastercard'
    
    // Elo
    if (['4011', '4312', '4389', '4514', '4576', '5041', '5066', '5067', '6277', '6362', '6363'].includes(firstFour)) return 'elo'
    
    // Amex
    if (['34', '37'].includes(firstTwo)) return 'amex'
    
    // Discover
    if (firstFour === '6011' || parseInt(firstTwo) === 65 || (parseInt(firstFour) >= 6440 && parseInt(firstFour) <= 6599)) return 'discover'

    // Usar paymentMethodId do Mercado Pago se disponível
    if (paymentMethodId) {
      if (paymentMethodId === 'visa') return 'visa'
      if (paymentMethodId === 'master') return 'mastercard'
      if (paymentMethodId === 'elo') return 'elo'
      if (paymentMethodId === 'amex') return 'amex'
    }

    return 'unknown'
  }

  const cardBrand = getCardBrand()

  // Cores baseadas no banco emissor
  const getCardGradient = () => {
    if (issuerName?.toLowerCase().includes('nubank')) {
      return 'linear-gradient(135deg, #892a92, #70217a)'
    }
    if (issuerName?.toLowerCase().includes('inter')) {
      return 'linear-gradient(135deg, #ff7a00, #ff5000)'
    }
    if (issuerName?.toLowerCase().includes('bradesco')) {
      return 'linear-gradient(135deg, #cc092f, #8b0000)'
    }
    if (issuerName?.toLowerCase().includes('itau')) {
      return 'linear-gradient(135deg, #003d7a, #0051a5)'
    }
    if (issuerName?.toLowerCase().includes('santander')) {
      return 'linear-gradient(135deg, #ec0000, #c00000)'
    }
    if (issuerName?.toLowerCase().includes('caixa')) {
      return 'linear-gradient(135deg, #0066b3, #004a85)'
    }
    
    // Cor padrão baseada na bandeira
    if (cardBrand === 'visa') {
      return 'linear-gradient(135deg, #1434cb, #0f2b9c)'
    }
    if (cardBrand === 'mastercard') {
      return 'linear-gradient(135deg, #eb001b, #f79e1b)'
    }
    
    return 'linear-gradient(135deg, #434343, #000000)'
  }

  return (
    <div className="credit-card-preview-wrapper">
      <div className="credit-card" style={{ background: getCardGradient() }}>
        {/* Chip do cartão */}
        <div className="card-chip">
          <div className="chip-line"></div>
          <div className="chip-line"></div>
          <div className="chip-line"></div>
          <div className="chip-line"></div>
        </div>

        {/* Número do cartão */}
        <div className="card-number">
          {formattedNumber}
        </div>

        {/* Informações inferiores */}
        <div className="card-footer">
          <div className="card-holder">
            <div className="card-label">Nome do Titular</div>
            <div className="card-value">{formattedName}</div>
          </div>
          <div className="card-expiry">
            <div className="card-label">Validade</div>
            <div className="card-value">{formattedDate}</div>
          </div>
        </div>

        {/* Bandeira do cartão */}
        <div className="card-brand">
          {cardBrand === 'visa' && (
            <div className="brand-visa">VISA</div>
          )}
          {cardBrand === 'mastercard' && (
            <div className="brand-mastercard">
              <div className="mc-circle mc-red"></div>
              <div className="mc-circle mc-yellow"></div>
            </div>
          )}
          {cardBrand === 'elo' && (
            <div className="brand-elo">elo</div>
          )}
          {cardBrand === 'amex' && (
            <div className="brand-amex">AMEX</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .credit-card-preview-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem 0;
        }

        .credit-card {
          width: 350px;
          height: 220px;
          border-radius: 15px;
          padding: 25px;
          color: white;
          font-family: 'Courier New', monospace;
          position: relative;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 
                      inset 0 0 10px rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          transform-style: preserve-3d;
        }

        .credit-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
        }

        .card-chip {
          width: 50px;
          height: 40px;
          background: linear-gradient(135deg, #d4af37, #f9e79f);
          border-radius: 8px;
          margin-bottom: 30px;
          position: relative;
          overflow: hidden;
        }

        .chip-line {
          position: absolute;
          width: 100%;
          height: 1px;
          background: rgba(0, 0, 0, 0.2);
        }

        .chip-line:nth-child(1) { top: 10px; }
        .chip-line:nth-child(2) { top: 20px; }
        .chip-line:nth-child(3) { top: 30px; }
        .chip-line:nth-child(4) { 
          width: 1px;
          height: 100%;
          left: 25px;
          top: 0;
        }

        .card-number {
          font-size: 24px;
          letter-spacing: 3px;
          margin-bottom: 25px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          font-weight: 300;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .card-holder,
        .card-expiry {
          flex: 1;
        }

        .card-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.8;
          margin-bottom: 5px;
        }

        .card-value {
          font-size: 14px;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .card-brand {
          position: absolute;
          right: 25px;
          bottom: 25px;
        }

        .brand-visa {
          font-size: 32px;
          font-weight: bold;
          font-style: italic;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .brand-mastercard {
          display: flex;
          gap: -10px;
          position: relative;
        }

        .mc-circle {
          width: 35px;
          height: 35px;
          border-radius: 50%;
        }

        .mc-red {
          background-color: #eb001b;
          position: absolute;
          right: 15px;
        }

        .mc-yellow {
          background-color: #f79e1b;
          position: absolute;
          right: 0;
        }

        .brand-elo {
          font-size: 28px;
          font-weight: bold;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .brand-amex {
          font-size: 24px;
          font-weight: bold;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        @media (max-width: 640px) {
          .credit-card {
            width: 100%;
            max-width: 350px;
            height: auto;
            aspect-ratio: 1.586;
          }

          .card-number {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  )
}

