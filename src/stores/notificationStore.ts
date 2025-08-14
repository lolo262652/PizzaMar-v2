import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Tables, TablesInsert } from '../lib/supabase'
import toast from 'react-hot-toast'

interface NotificationState {
  notifications: Tables<'notifications'>[]
  unreadCount: number
  loading: boolean
  loadNotifications: (userId: string) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: (userId: string) => Promise<void>
  createNotification: (notification: Omit<TablesInsert<'notifications'>, 'id' | 'created_at'>) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  loadNotifications: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const notifications = data || []
      const unreadCount = notifications.filter(n => !n.is_read).length

      set({ 
        notifications, 
        unreadCount,
        loading: false 
      })
    } catch (error) {
      console.error('Error loading notifications:', error)
      set({ loading: false })
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      const { notifications } = get()
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      )
      const unreadCount = updatedNotifications.filter(n => !n.is_read).length

      set({ 
        notifications: updatedNotifications,
        unreadCount
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error

      const { notifications } = get()
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }))

      set({ 
        notifications: updatedNotifications,
        unreadCount: 0
      })

      toast.success('Toutes les notifications marquées comme lues')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Erreur lors de la mise à jour des notifications')
    }
  },

  createNotification: async (notificationData) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notificationData)

      if (error) throw error
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  },
}))

// Écouter les nouvelles notifications en temps réel
export const subscribeToNotifications = (userId: string, onNewNotification: (notification: Tables<'notifications'>) => void) => {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNewNotification(payload.new as Tables<'notifications'>)
      }
    )
    .subscribe()
}