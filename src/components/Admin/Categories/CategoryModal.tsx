import React, { useEffect } from 'react'
import { X, Tag, FileText, Hash, Image } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminStore } from '../../../stores/adminStore'
import type { Tables } from '../../../lib/supabase'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category?: Tables<'categories'> | null
}

const categorySchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  image_url: z.string().url('URL invalide').optional().or(z.literal('')),
  display_order: z.number().min(0, 'L\'ordre doit être positif'),
  is_active: z.boolean(),
})

type CategoryForm = z.infer<typeof categorySchema>

export default function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
  const { createCategory, updateCategory } = useAdminStore()

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      image_url: '',
      display_order: 0,
      is_active: true,
    }
  })

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || '',
        image_url: category.image_url || '',
        display_order: category.display_order,
        is_active: category.is_active,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        image_url: '',
        display_order: 0,
        is_active: true,
      })
    }
  }, [category, form])

  const handleSubmit = async (data: CategoryForm) => {
    try {
      let result
      if (category) {
        result = await updateCategory(category.id, data)
      } else {
        result = await createCategory(data)
      }

      if (!result.error) {
        onClose()
        form.reset()
      }
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Tag className="w-6 h-6 text-red-600" />
              <span>{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</span>
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
                Nom de la catégorie *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...form.register('name')}
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Pizzas, Boissons, Desserts..."
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
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  {...form.register('description')}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Description de la catégorie..."
                />
              </div>
              {form.formState.errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.description.message}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordre d'affichage
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...form.register('display_order', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              {form.formState.errors.display_order && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.display_order.message}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                {...form.register('is_active')}
                type="checkbox"
                id="is_active"
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Catégorie active (visible sur le site)
              </label>
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
                  : category ? 'Modifier' : 'Créer'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}