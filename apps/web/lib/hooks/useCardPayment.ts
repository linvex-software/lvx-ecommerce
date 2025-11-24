import { useState } from 'react'

export const useCardPayment = () => {
    const [isValid, setIsValid] = useState(false)

    const validateCard = (number: string, name: string, expiry: string, cvv: string) => {
        // Simple mock validation
        const valid = number.length >= 16 && name.length > 0 && expiry.length >= 5 && cvv.length >= 3
        setIsValid(valid)
        return valid
    }

    return {
        isValid,
        validateCard
    }
}
