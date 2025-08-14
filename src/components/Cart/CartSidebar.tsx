import React from 'react'
import { X, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import CheckoutModal from '../Checkout/CheckoutModal'

export default function CartSidebar() {
  const [showCheckout, setShowCheckout] = React.useState(false)
  const { 
    items, 
    isOpen, 
    toggleCart, 
    removeItem, 
    updateQuantity, 
    getTotalPrice,
    getTotalItems 
  } = useCartStore()

  const totalPrice = getTotalPrice()
  const totalItems = getTotalItems()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={toggleCart}
      />
      
      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <ShoppingBag className="w-6 h-6 text-red-600" />
              <span>Panier ({totalItems})</span>
            </h2>
            <button
              onClick={toggleCart}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Votre panier est vide</p>
                <p className="text-gray-400 text-sm mt-2">
                  Ajoutez des produits pour commencer votre commande
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        
                        {/* Size and Crust for pizzas */}
                        {item.isPizza && (
                          <div className="text-sm text-gray-600 mt-1">
                            {item.size && (
                              <span className="capitalize">
                                Taille: {item.size === 'small' ? 'Petite' : item.size === 'medium' ? 'Moyenne' : 'Grande'}
                              </span>
                            )}
                            {item.crust && (
                              <span className="ml-2 capitalize">
                                Pâte: {item.crust === 'thin' ? 'Fine' : item.crust === 'thick' ? 'Épaisse' : 'Farcie'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Toppings */}
                        {item.selectedToppings.length > 0 && (
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Garnitures:</span>
                            <span className="ml-1">
                              {item.selectedToppings.map(t => t.name).join(', ')}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-red-600">
                              {item.totalPrice.toFixed(2)} €
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 ml-4"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-red-600">{totalPrice.toFixed(2)} €</span>
              </div>
              
              <button 
                onClick={() => setShowCheckout(true)}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Commander ({totalItems} articles)
              </button>
            </div>
          )}
        </div>
      </div>
      
      <CheckoutModal 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)} 
      />
    </>
  )
}