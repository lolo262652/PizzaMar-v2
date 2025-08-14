import React, { useEffect } from 'react'
import { X, Package, FileText, DollarSign, Image, Pizza } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminStore } from '../../../stores/adminStore'
import type { Tables } from '../../../lib/supabase'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Tables<'products'> | null
}

const productSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Veuillez sélectionner une catégorie'),
  base_price: z.number().min(0, 'Le prix doit être positif'),
  image_url: z.string().url('URL invalide').optional().or(z.literal('')),
  is_available: z.boolean(),
  is_pizza: z.boolean(),
})

type ProductForm = z.infer<typeof productSchema>

export default function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const { categories, createProduct, updateProduct } = useAdminStore()

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      base_price: 0,
      image_url: '',
      is_available: true,
      is_pizza: false,
    }
  })

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || '',
        category_id: product.category_id,
        base_price: product.base_price,
        image_url: product.image_url || '',
        is_available: product.is_available,
        is_pizza: product.is_pizza,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        category_id: '',
        base_price: 0,
        image_url: '',
        is_available: true,
        is_pizza: false,
      })
    }
  }, [product, form])

  const handleSubmit = async (data: ProductForm) => {
    try {
      let result
      if (product) {
        result = await updateProduct(product.id, data)
      } else {
        result = await createProduct(data)
      }

      if (!result.error) {
        onClose()
        form.reset()
      }
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Package className="w-6 h-6 text-red-600" />
              <span>{product ? 'Modifier le produit' : 'Nouveau produit'}</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du produit *
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...form.register('name')}
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Pizza Margherita, Coca-Cola..."
                />
              </div>
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                {...form.register('category_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.filter(cat => cat.is_active).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.category_id && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.category_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  {...form.register('description')}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Description du produit..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix de base * (€)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...form.register('base_price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="12.50"
                />
              </div>
              {form.formState.errors.base_price && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.base_price.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de l'image
              </label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...form.register('image_url')}
                  type="url"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {form.formState.errors.image_url && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.image_url.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  {...form.register('is_pizza')}
                  type="checkbox"
                  id="is_pizza"
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                />
                <label htmlFor="is_pizza" className="ml-2 text-sm text-gray-700 flex items-center">
                  <Pizza className="w-4 h-4 mr-1" />
                  C'est une pizza (personnalisable)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...form.register('is_available')}
                  type="checkbox"
                  id="is_available"
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                />
                <label htmlFor="is_available" className="ml-2 text-sm text-gray-700">
                  Produit disponible (visible sur le site)
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {form.formState.isSubmitting 
                  ? 'Enregistrement...' 
                  : product ? 'Modifier' : 'Créer'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}