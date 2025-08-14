import React, { useEffect, useState } from 'react'
import { Clock, CheckCircle, Truck, X, RefreshCw } from 'lucide-react'
import { useOrderStore, type OrderWithDetails } from '../../stores/orderStore'
import { useAuthStore } from '../../stores/authStore'
import type { Tables } from '../../lib/supabase'

const statusConfig = {
  pending: { 
    label: 'En attente', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock 
  },
  confirmed: { 
    label: 'Confirmée', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle 
  },
  preparing: { 
    label: 'En préparation', 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: RefreshCw 
  },
  ready: { 
    label: 'Prête', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle 
  },
  delivered: { 
    label: 'Livrée', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Truck 
  },
  cancelled: { 
    label: 'Annulée', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: X 
  },
}

export default function KitchenDashboard() {
  const { orders, loading, loadOrders, updateOrderStatus } = useOrderStore()
  const { profile } = useAuthStore()
  const [selectedStatus, setSelectedStatus] = useState<Tables<'orders'>['status'] | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadOrders()
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [loadOrders])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  const handleStatusUpdate = async (orderId: string, newStatus: Tables<'orders'>['status']) => {
    await updateOrderStatus(orderId, newStatus)
  }

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus)

  const getNextStatus = (currentStatus: Tables<'orders'>['status']): Tables<'orders'>['status'] | null => {
    const statusFlow: Record<Tables<'orders'>['status'], Tables<'orders'>['status'] | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivered',
      delivered: null,
      cancelled: null,
    }
    return statusFlow[currentStatus]
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  // Vérifier si l'utilisateur est admin (email spécifique)
  if (!user || user.email !== 'laurent.habib@gmail.com') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Seul l'administrateur peut accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord cuisine</h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtres de statut */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Toutes ({orders.length})
            </button>
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = orders.filter(order => order.status === status).length
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status as Tables<'orders'>['status'])}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedStatus === status
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {config.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Liste des commandes */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-2 text-gray-600">Chargement des commandes...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune commande à afficher</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status]
              const Icon = config.icon
              const nextStatus = getNextStatus(order.status)

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Commande #{order.id.slice(-8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
                          <Icon className="w-4 h-4 inline mr-1" />
                          {config.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Client:</strong> {order.users.full_name}</p>
                        <p><strong>Téléphone:</strong> {order.users.phone || 'Non renseigné'}</p>
                        <p><strong>Adresse:</strong> {order.addresses.street}, {order.addresses.city}</p>
                        <p><strong>Commande:</strong> {formatDate(order.created_at)} à {formatTime(order.created_at)}</p>
                        <p><strong>Total:</strong> <span className="font-semibold text-red-600">{order.total_amount.toFixed(2)} €</span></p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {nextStatus && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, nextStatus)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Passer à "{statusConfig[nextStatus].label}"
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Articles de la commande */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Articles commandés:</h4>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{item.quantity}x {item.products.name}</span>
                            {item.size && (
                              <span className="text-sm text-gray-600 ml-2">
                                (Taille: {item.size === 'small' ? 'Petite' : item.size === 'medium' ? 'Moyenne' : 'Grande'})
                              </span>
                            )}
                            {item.crust && (
                              <span className="text-sm text-gray-600 ml-2">
                                (Pâte: {item.crust === 'thin' ? 'Fine' : item.crust === 'thick' ? 'Épaisse' : 'Farcie'})
                              </span>
                            )}
                            {item.selected_toppings.length > 0 && (
                              <div className="text-sm text-gray-600 mt-1">
                                Garnitures: {item.selected_toppings.join(', ')}
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-red-600">
                            {item.total_price.toFixed(2)} €
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Notes:</h4>
                      <p className="text-gray-600 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}