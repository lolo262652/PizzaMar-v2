import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CreditCard, CheckCircle, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function PaymentPage() {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const amount = searchParams.get('amount')
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (full_name, phone),
          addresses (street, city, postal_code),
          order_items (
            *,
            products (name)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Commande introuvable')
    } finally {
      setLoading(false)
    }
  }

  const processPayment = async () => {
    if (!order) return

    setProcessing(true)
    try {
      // Simulation du paiement (à remplacer par Stripe)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mettre à jour le statut de paiement
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed'
        })
        .eq('id', orderId)

      if (error) throw error

      // Créer une notification de confirmation
      await supabase
        .from('notifications')
        .insert({
          user_id: order.user_id,
          order_id: orderId,
          type: 'order_confirmed',
          title: 'Paiement confirmé',
          message: 'Votre paiement a été accepté. Votre commande est confirmée et sera bientôt préparée.'
        })

      setPaymentSuccess(true)
      toast.success('Paiement réussi !')
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Erreur lors du paiement')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Commande introuvable</h2>
          <p className="text-gray-600">Cette commande n'existe pas ou a expiré.</p>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement réussi !</h2>
            <p className="text-gray-600 mb-6">
              Votre commande #{order.id.slice(-8)} a été confirmée.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                Vous recevrez une notification lorsque votre commande sera prête.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white p-6">
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <CreditCard className="w-6 h-6" />
              <span>Paiement de votre commande</span>
            </h1>
            <p className="text-red-100 mt-2">
              Commande #{order.id.slice(-8)}
            </p>
          </div>

          <div className="p-6">
            {/* Customer Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Informations de livraison</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>Client :</strong> {order.users.full_name}</p>
                <p><strong>Téléphone :</strong> {order.users.phone}</p>
                <p><strong>Adresse :</strong> {order.addresses.street}, {order.addresses.postal_code} {order.addresses.city}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Détail de la commande</h3>
              <div className="space-y-2">
                {order.order_items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="font-medium">{item.quantity}x {item.products.name}</span>
                      {item.size && (
                        <span className="text-sm text-gray-600 ml-2">
                          (Taille: {item.size})
                        </span>
                      )}
                      {item.selected_toppings.length > 0 && (
                        <div className="text-sm text-gray-600">
                          + {item.selected_toppings.join(', ')}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold">{item.total_price.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total à payer :</span>
                <span className="text-red-600">{amount} €</span>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={processPayment}
              disabled={processing || order.payment_status === 'paid'}
              className="w-full bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Traitement en cours...</span>
                </>
              ) : order.payment_status === 'paid' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Déjà payé</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Payer maintenant</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Paiement sécurisé - Vos données sont protégées
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}