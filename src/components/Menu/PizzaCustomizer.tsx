import React, { useState, useEffect } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
}

interface Topping {
  id: string
  name: string
  price: number
  is_available: boolean
}

interface PizzaCustomizerProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onAddToCart: (customization: {
    size: 'small' | 'medium' | 'large'
    crust: 'thin' | 'thick' | 'stuffed'
    toppings: Array<{ id: string; name: string; price: number }>
    quantity: number
  }) => void
}

export default function PizzaCustomizer({ product, isOpen, onClose, onAddToCart }: PizzaCustomizerProps) {
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [crust, setCrust] = useState<'thin' | 'thick' | 'stuffed'>('thin')
  const [selectedToppings, setSelectedToppings] = useState<Array<{ id: string; name: string; price: number }>>([])
  const [quantity, setQuantity] = useState(1)
  const [availableToppings, setAvailableToppings] = useState<Topping[]>([])
  const [loadingToppings, setLoadingToppings] = useState(true)

  const sizeMultipliers = { small: 0.8, medium: 1, large: 1.3 }
  const crustPrices = { thin: 0, thick: 1.5, stuffed: 3.0 }

  useEffect(() => {
    if (isOpen) {
      loadToppings()
    }
  }, [isOpen])

  const loadToppings = async () => {
    try {
      const { data, error } = await supabase
        .from('toppings')
        .select('*')
        .eq('is_available', true)
        .order('name')

      if (error) throw error
      setAvailableToppings(data || [])
    } catch (error) {
      console.error('Error loading toppings:', error)
    } finally {
      setLoadingToppings(false)
    }
  }

  const calculatePrice = () => {
    let basePrice = product.base_price * sizeMultipliers[size]
    basePrice += crustPrices[crust]
    const toppingsPrice = selectedToppings.reduce((sum, topping) => sum + topping.price, 0)
    return (basePrice + toppingsPrice) * quantity
  }

  const handleToppingToggle = (topping: Topping) => {
    const isSelected = selectedToppings.some(t => t.id === topping.id)
    if (isSelected) {
      setSelectedToppings(prev => prev.filter(t => t.id !== topping.id))
    } else {
      setSelectedToppings(prev => [...prev, {
        id: topping.id,
        name: topping.name,
        price: topping.price
      }])
    }
  }

  const handleAddToCart = () => {
    onAddToCart({
      size,
      crust,
      toppings: selectedToppings,
      quantity
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-gray-600 mt-1">{product.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="md:col-span-1">
              <img
                src={product.image_url || 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg'}
                alt={product.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>

            {/* Customization Options */}
            <div className="md:col-span-1 space-y-6">
              {/* Size Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Taille</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((sizeOption) => (
                    <button
                      key={sizeOption}
                      onClick={() => setSize(sizeOption)}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        size === sizeOption
                          ? 'border-red-600 bg-red-50 text-red-600'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="font-medium">
                        {sizeOption === 'small' ? 'Petite' : sizeOption === 'medium' ? 'Moyenne' : 'Grande'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {(product.base_price * sizeMultipliers[sizeOption]).toFixed(2)} €
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crust Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Pâte</h3>
                <div className="space-y-2">
                  {(['thin', 'thick', 'stuffed'] as const).map((crustOption) => (
                    <button
                      key={crustOption}
                      onClick={() => setCrust(crustOption)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        crust === crustOption
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {crustOption === 'thin' ? 'Pâte fine' : crustOption === 'thick' ? 'Pâte épaisse' : 'Pâte farcie'}
                        </span>
                        <span className="text-gray-600">
                          {crustPrices[crustOption] > 0 ? `+${crustPrices[crustOption].toFixed(2)} €` : 'Gratuit'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toppings */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Garnitures ({selectedToppings.length} sélectionnées)
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {loadingToppings ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                    </div>
                  ) : (
                    availableToppings.map((topping) => {
                    const isSelected = selectedToppings.some(t => t.id === topping.id)
                    return (
                      <button
                        key={topping.id}
                        onClick={() => handleToppingToggle(topping)}
                        className={`w-full p-2 rounded-lg border-2 text-left transition-colors ${
                          isSelected
                            ? 'border-red-600 bg-red-50'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{topping.name}</span>
                          <span className="text-gray-600">+{topping.price.toFixed(2)} €</span>
                        </div>
                      </button>
                    )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantité:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {calculatePrice().toFixed(2)} €
                </div>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold mt-4"
            >
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}