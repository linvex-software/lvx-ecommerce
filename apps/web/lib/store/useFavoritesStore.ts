import { create } from 'zustand'

interface FavoritesState {
  isOpen: boolean
  openFavorites: () => void
  closeFavorites: () => void
  toggleFavorites: () => void
}

/**
 * Store para gerenciar o estado do menu de favoritos
 * Similar ao useCartStore, mas para favoritos
 */
export const useFavoritesStore = create<FavoritesState>((set) => ({
  isOpen: false,
  openFavorites: () => set({ isOpen: true }),
  closeFavorites: () => set({ isOpen: false }),
  toggleFavorites: () => set((state) => ({ isOpen: !state.isOpen }))
}))

