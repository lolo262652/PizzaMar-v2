import React, { useState } from 'react'
import { Plus, Star } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import PizzaCustomizer from './PizzaCustomizer'

interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
  is_pizza: boolean
  is_available: boolean
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [showCustomizer, setShowCustomizer] = useState(false)
  const { addItem } = useCartStore()

  const handleAddToCart = () => {
    if (product.is_pizza) {
      setShowCustomizer(true)
    } else {
      addItem({
        productId: product.id,
        name: product.name,
        basePrice: product.base_price,
        quantity: 1,
        selectedToppings: [],
        imageUrl: product.image_url || undefined,
        isPizza: false
      })
    }
  }

  const handleCustomizedAdd = (customization: {
    size: 'small' | 'medium' | 'large'
    crust: 'thin' | 'thick' | 'stuffed'
    toppings: Array<{ id: string; name: string; price: number }>
    quantity: number
  }) => {
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: product.base_price,
      quantity: customization.quantity,
      size: customization.size,
      crust: customization.crust,
      selectedToppings: customization.toppings,
      imageUrl: product.image_url || undefined,
      isPizza: true
    })
    setShowCustomizer(false)
  }

  if (!product.is_available) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden opacity-60">
        <div className="relative">
          <img
            src={product.image_url || 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg'}
            alt={product.name}
            className="w-full h-48 object-cover grayscale"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Non disponible</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-500">{product.name}</h3>
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{product.description}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
        <div className="relative">
          <img
            src={product.image_url || 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg'}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Rating Badge */}
          <div className="absolute top-3 left-3 bg-white bg-opacity-90 rounded-full px-2 py-1 flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">4.5</span>
          </div>

          {/* Pizza Badge */}
          {product.is_pizza && (
            <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              Pizza
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
              {product.name}
            </h3>
            <span className="text-xl font-bold text-red-600">
              À partir de {product.base_price.toFixed(2)} €
            </span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {product.description || 'Délicieux produit préparé avec des ingrédients frais'}
          </p>

          <button
            onClick={handleAddToCart}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2 group"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{product.is_pizza ? 'Personnaliser' : 'Ajouter au panier'}</span>
          </button>
        </div>
      </div>

      {showCustomizer && (
        <PizzaCustomizer
          product={product}
          isOpen={showCustomizer}
          onClose={() => setShowCustomizer(false)}
          onAddToCart={handleCustomizedAdd}
        />
      )}
    </>
  )
}