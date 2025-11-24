import { useState } from 'react'

export const usePixPayment = () => {
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [copyPasteCode, setCopyPasteCode] = useState<string | null>(null)

    const generateQrCode = async () => {
        // Mock generation
        setQrCode('https://via.placeholder.com/200x200?text=QR+Code+Pix')
        setCopyPasteCode('00020126330014BR.GOV.BCB.PIX011100000000000520400005303986540510.005802BR5913Fulano de Tal6008Brasilia62070503***6304E2CA')
    }

    return {
        qrCode,
        copyPasteCode,
        generateQrCode
    }
}
