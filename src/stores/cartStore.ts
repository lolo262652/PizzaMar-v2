import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  basePrice: number
  quantity: number
  size?: 'small' | 'medium' | 'large'
  crust?: 'thin' | 'thick' | 'stuffed'
  selectedToppings: Array<{ id: string; name: string; price: number }>
  totalPrice: number
  imageUrl?: string
  isPizza: boolean
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

const calculateItemPrice = (item: Omit<CartItem, 'id' | 'totalPrice'>): number => {
  let price = item.basePrice

  // Size multipliers for pizzas
  if (item.isPizza && item.size) {
    const sizeMultipliers = { small: 0.8, medium: 1, large: 1.3 }
    price *= sizeMultipliers[item.size]
  }

  // Add toppings
  const toppingsPrice = item.selectedToppings.reduce((sum, topping) => sum + topping.price, 0)
  price += toppingsPrice

  return price * item.quantity
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const id = `${newItem.productId}_${newItem.size || ''}_${newItem.crust || ''}_${newItem.selectedToppings.map(t => t.id).join(',')}`
        const totalPrice = calculateItemPrice(newItem)
        
        set((state) => {
          const existingItemIndex = state.items.findIndex(item => item.id === id)
          
          if (existingItemIndex >= 0) {
            const updatedItems = [...state.items]
            updatedItems[existingItemIndex].quantity += newItem.quantity
            updatedItems[existingItemIndex].totalPrice = calculateItemPrice({
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity
            })
            return { items: updatedItems }
          } else {
            return {
              items: [...state.items, { ...newItem, id, totalPrice }]
            }
          }
        })
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }))
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        set((state) => ({
          items: state.items.map(item =>
            item.id === id
              ? {
                  ...item,
                  quantity,
                  totalPrice: calculateItemPrice({ ...item, quantity })
                }
              : item
          )
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }))
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.totalPrice, 0)
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'pizza-cart-storage',
    }
  )
)