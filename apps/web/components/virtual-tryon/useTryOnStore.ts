import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserBasicData, UserMeasurements } from './algorithm'

export type TryOnStep = 'user-data' | 'adjust' | 'result'

interface TryOnState {
  // Estado do wizard
  currentStep: TryOnStep
  isOpen: boolean

  // Dados do usuário
  userData: UserBasicData | null
  measurements: UserMeasurements | null

  // Ações
  setStep: (step: TryOnStep) => void
  setUserData: (data: UserBasicData) => void
  setMeasurements: (measurements: UserMeasurements) => void
  openModal: () => void
  closeModal: () => void
  reset: () => void
}

const initialState = {
  currentStep: 'user-data' as TryOnStep,
  isOpen: false,
  userData: null,
  measurements: null
}

export const useTryOnStore = create<TryOnState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setUserData: (data) => set({ userData: data }),

      setMeasurements: (measurements) => set({ measurements }),

      openModal: () => set({ isOpen: true }),

      closeModal: () => set({ isOpen: false, currentStep: 'user-data' }),

      reset: () => set({
        ...initialState,
        // Manter dados salvos, apenas resetar estado do wizard
        isOpen: false
      })
    }),
    {
      name: 'wl-tryon-store',
      storage: createJSONStorage(() => localStorage),
      // Persistir apenas dados do usuário, não estado do wizard
      partialize: (state) => ({
        userData: state.userData,
        measurements: state.measurements
      })
    }
  )
)

