import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Tables, TablesInsert } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AddressState {
  addresses: Tables<'addresses'>[]
  loading: boolean
  selectedAddress: Tables<'addresses'> | null
  loadAddresses: (userId: string) => Promise<void>
  addAddress: (address: Omit<TablesInsert<'addresses'>, 'user_id'>) => Promise<{ error?: string }>
  updateAddress: (id: string, address: Partial<Tables<'addresses'>>) => Promise<{ error?: string }>
  deleteAddress: (id: string) => Promise<{ error?: string }>
  setDefaultAddress: (id: string) => Promise<{ error?: string }>
  selectAddress: (address: Tables<'addresses'> | null) => void
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  loading: false,
  selectedAddress: null,

  loadAddresses: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      const addresses = data || []
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0] || null

      set({ 
        addresses, 
        selectedAddress: defaultAddress,
        loading: false 
      })
    } catch (error) {
      console.error('Error loading addresses:', error)
      set({ loading: false })
      toast.error('Erreur lors du chargement des adresses')
    }
  },

  addAddress: async (addressData) => {
    try {
      const { user } = await supabase.auth.getUser()
      if (!user.data.user) return { error: 'Non connecté' }

      // Si c'est la première adresse ou si elle est marquée par défaut, 
      // désactiver les autres adresses par défaut
      if (addressData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.data.user.id)
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          ...addressData,
          user_id: user.data.user.id
        })
        .select()
        .single()

      if (error) throw error

      const { addresses } = get()
      const newAddresses = [data, ...addresses]
      
      set({ 
        addresses: newAddresses,
        selectedAddress: data.is_default ? data : get().selectedAddress
      })

      toast.success('Adresse ajoutée avec succès')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de l\'ajout de l\'adresse'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  updateAddress: async (id, addressData) => {
    try {
      if (addressData.is_default) {
        const { user } = await supabase.auth.getUser()
        if (user.data.user) {
          await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', user.data.user.id)
        }
      }

      const { data, error } = await supabase
        .from('addresses')
        .update(addressData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const { addresses } = get()
      const updatedAddresses = addresses.map(addr => 
        addr.id === id ? data : addr
      )

      set({ 
        addresses: updatedAddresses,
        selectedAddress: data.is_default ? data : get().selectedAddress
      })

      toast.success('Adresse mise à jour')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  deleteAddress: async (id) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { addresses, selectedAddress } = get()
      const updatedAddresses = addresses.filter(addr => addr.id !== id)
      
      set({ 
        addresses: updatedAddresses,
        selectedAddress: selectedAddress?.id === id ? updatedAddresses[0] || null : selectedAddress
      })

      toast.success('Adresse supprimée')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la suppression'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  setDefaultAddress: async (id) => {
    try {
      const { user } = await supabase.auth.getUser()
      if (!user.data.user) return { error: 'Non connecté' }

      // Désactiver toutes les adresses par défaut
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.data.user.id)

      // Activer la nouvelle adresse par défaut
      const { data, error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const { addresses } = get()
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        is_default: addr.id === id
      }))

      set({ 
        addresses: updatedAddresses,
        selectedAddress: data
      })

      toast.success('Adresse par défaut mise à jour')
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  },

  selectAddress: (address) => {
    set({ selectedAddress: address })
  },
}))