import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import CategoryTabs from './CategoryTabs'
import ProductCard from './ProductCard'
import { Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
  display_order: number
}

interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
  is_pizza: boolean
  is_available: boolean
  category_id: string
}

export default function MenuSection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('name')

      setCategories(categoriesData || [])
      setProducts(productsData || [])
    } catch (error) {
      console.error('Error loading menu data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = activeCategory
    ? products.filter(product => product.category_id === activeCategory)
    : products

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <span className="ml-2 text-gray-600">Chargement du menu...</span>
      </div>
    )
  }

  return (
    <section id="menu" className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Menu</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez nos pizzas artisanales et nos produits frais, préparés avec passion
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun produit disponible dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}