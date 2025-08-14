import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AdminState {
  // Categories
  categories: Tables<'categories'>[]
  loadingCategories: boolean
  loadCategories: () => Promise<void>
  createCategory: (category: Omit<TablesInsert<'categories'>, 'id' | 'created_at'>) => Promise<{ error?: string }>
  updateCategory: (id: string, category: Partial<Tables<'categories'>>) => Promise<{ error?: string }>
  deleteCategory: (id: string) => Promise<{ error?: string }>

  // Products
  products: Tables<'products'>[]
  loadingProducts: boolean
  loadProducts: () => Promise<void>
  createProduct: (product: Omit<TablesInsert<'products'>, 'id' | 'created_at'>) => Promise<{ error?: string }>
  updateProduct: (id: string, product: Partial<Tables<'products'>>) => Promise<{ error?: string }>
  deleteProduct: (id: string) => Promise<{ error?: string }>

  // Toppings
  toppings: Tables<'toppings'>[]
  loadingToppings: boolean
  loadToppings: () => Promise<void>
  createTopping: (topping: Omit<TablesInsert<'toppings'>, 'id' | 'created_at'>) => Promise<{ error?: string }>
  updateTopping: (id: string, topping: Partial<Tables<'toppings'>>) => Promise<{ error?: string }>
  deleteTopping: (id: string) => Promise<{ error?: string }>

  // Users
  users: Tables<'users'>[]
  loadingUsers: boolean
  loadUsers: () => Promise<void>
  updateUserRole: (id: string, role: 'customer' | 'admin') => Promise<{ error?: string }>

  // Statistics
  stats: {
    totalOrders: number
    totalRevenue: number
    totalCustomers: number
    ordersToday: number
  }
  loadingStats: boolean
  loadStats: () => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Categories
  categories: [],
  loadingCategories: false,

  loadCategories: async () => {
    set({ loadingCategories: true })
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order')

      if (error) throw error
      set({ categories: data || [], loadingCategories: false })
    } catch (error) {
      console.error('Error loading categories:', error)
      set({ loadingCategories: false })
      toast.error('Erreur lors du chargement des catégories')
    }
  },

  createCategory: async (categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single()

      if (error) throw error

      const { categories } = get()
      set({ categories: [...categories, data] })
      toast.success('Catégorie créée avec succès')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la création'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const { categories } = get()
      set({ 
        categories: categories.map(cat => cat.id === id ? data : cat)
      })
      toast.success('Catégorie mise à jour')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  deleteCategory: async (id) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { categories } = get()
      set({ categories: categories.filter(cat => cat.id !== id) })
      toast.success('Catégorie supprimée')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la suppression'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  // Products
  products: [],
  loadingProducts: false,

  loadProducts: async () => {
    set({ loadingProducts: true })
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name)
        `)
        .order('name')

      if (error) throw error
      set({ products: data || [], loadingProducts: false })
    } catch (error) {
      console.error('Error loading products:', error)
      set({ loadingProducts: false })
      toast.error('Erreur lors du chargement des produits')
    }
  },

  createProduct: async (productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select(`
          *,
          categories (name)
        `)
        .single()

      if (error) throw error

      const { products } = get()
      set({ products: [...products, data] })
      toast.success('Produit créé avec succès')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la création'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select(`
          *,
          categories (name)
        `)
        .single()

      if (error) throw error

      const { products } = get()
      set({ 
        products: products.map(prod => prod.id === id ? data : prod)
      })
      toast.success('Produit mis à jour')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  deleteProduct: async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { products } = get()
      set({ products: products.filter(prod => prod.id !== id) })
      toast.success('Produit supprimé')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la suppression'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  // Toppings
  toppings: [],
  loadingToppings: false,

  loadToppings: async () => {
    set({ loadingToppings: true })
    try {
      const { data, error } = await supabase
        .from('toppings')
        .select('*')
        .order('name')

      if (error) throw error
      set({ toppings: data || [], loadingToppings: false })
    } catch (error) {
      console.error('Error loading toppings:', error)
      set({ loadingToppings: false })
      toast.error('Erreur lors du chargement des garnitures')
    }
  },

  createTopping: async (toppingData) => {
    try {
      const { data, error } = await supabase
        .from('toppings')
        .insert(toppingData)
        .select()
        .single()

      if (error) throw error

      const { toppings } = get()
      set({ toppings: [...toppings, data] })
      toast.success('Garniture créée avec succès')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la création'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  updateTopping: async (id, toppingData) => {
    try {
      const { data, error } = await supabase
        .from('toppings')
        .update(toppingData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const { toppings } = get()
      set({ 
        toppings: toppings.map(top => top.id === id ? data : top)
      })
      toast.success('Garniture mise à jour')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  deleteTopping: async (id) => {
    try {
      const { error } = await supabase
        .from('toppings')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { toppings } = get()
      set({ toppings: toppings.filter(top => top.id !== id) })
      toast.success('Garniture supprimée')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la suppression'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  // Users
  users: [],
  loadingUsers: false,

  loadUsers: async () => {
    set({ loadingUsers: true })
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ users: data || [], loadingUsers: false })
    } catch (error) {
      console.error('Error loading users:', error)
      set({ loadingUsers: false })
      toast.error('Erreur lors du chargement des utilisateurs')
    }
  },

  updateUserRole: async (id, role) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const { users } = get()
      set({ 
        users: users.map(user => user.id === id ? data : user)
      })
      toast.success('Rôle utilisateur mis à jour')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  // Statistics
  stats: {
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    ordersToday: 0
  },
  loadingStats: false,

  loadStats: async () => {
    set({ loadingStats: true })
    try {
      // Total orders and revenue
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, created_at')

      // Total customers
      const { count: customersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')

      // Orders today
      const today = new Date().toISOString().split('T')[0]
      const { count: ordersTodayCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      const totalOrders = ordersData?.length || 0
      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

      set({
        stats: {
          totalOrders,
          totalRevenue,
          totalCustomers: customersCount || 0,
          ordersToday: ordersTodayCount || 0
        },
        loadingStats: false
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      set({ loadingStats: false })
    }
  },
}))