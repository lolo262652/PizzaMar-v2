import React, { useEffect } from 'react'
import { X, Pizza, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAdminStore } from '../../../stores/adminStore'
import type { Tables } from '../../../lib/supabase'

interface ToppingModalProps {
  isOpen: boolean
  onClose: () => void
  topping?: Tables<'toppings'> | null
}

const toppingSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  price: z.number().min(0, 'Le prix doit être positif'),
  is_available: z.boolean(),
})

type ToppingForm = z.infer<typeof toppingSchema>

export default function ToppingModal({ isOpen, onClose, topping }: ToppingModalProps) {
  const { createTopping, updateTopping } = useAdminStore()

  const form = useForm<ToppingForm>({
    resolver: zodResolver(toppingSchema),
    defaultValues: {
      name: '',
      price: 0,
      is_available: true,
    }
  })

  useEffect(() => {
    if (topping) {
      form.reset({
        name: topping.name,
        price: topping.price,
        is_available: topping.is_available,
      })
    } else {
      form.reset({
        name: '',
        price: 0,
        is_available: true,
      })
    }
  }, [topping, form])

  const handleSubmit = async (data: ToppingForm) => {
    try {
      let result
      if (topping) {
        result = await updateTopping(topping.id, data)
      } else {
        result = await createTopping(data)
      }

      if (!result.error) {
        onClose()
        form.reset()
      }
    } catch (error) {
      console.error('Error saving topping:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Pizza className="w-6 h-6 text-red-600" />
              <span>{topping ? 'Modifier la garniture' : 'Nouvelle garniture'}</span>
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
                Nom de la garniture *
              </label>
              <div className="relative">
                <Pizza className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...form.register('name')}
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Pepperoni, Champignons, Olives..."
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
                Prix supplémentaire * (€)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...form.register('price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="2.50"
                />
              </div>
              {form.formState.errors.price && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                {...form.register('is_available')}
                type="checkbox"
                id="is_available"
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <label htmlFor="is_available" className="ml-2 text-sm text-gray-700">
                Garniture disponible (visible lors de la personnalisation)
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
                  : topping ? 'Modifier' : 'Créer'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}