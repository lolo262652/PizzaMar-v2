import React, { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { useAdminStore } from '../../../stores/adminStore'
import ToppingModal from './ToppingModal'
import type { Tables } from '../../../lib/supabase'

export default function ToppingsManager() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTopping, setEditingTopping] = useState<Tables<'toppings'> | null>(null)
  
  const { 
    toppings, 
    loadingToppings, 
    loadToppings, 
    deleteTopping,
    updateTopping 
  } = useAdminStore()

  useEffect(() => {
    loadToppings()
  }, [loadToppings])

  const handleEdit = (topping: Tables<'toppings'>) => {
    setEditingTopping(topping)
    setIsModalOpen(true)
  }

  const handleDelete = async (topping: Tables<'toppings'>) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la garniture "${topping.name}" ?`)) {
      await deleteTopping(topping.id)
    }
  }

  const handleToggleAvailable = async (topping: Tables<'toppings'>) => {
    await updateTopping(topping.id, { is_available: !topping.is_available })
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTopping(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Garnitures</h1>
          <p className="text-gray-600 mt-2">
            Gérez les garnitures disponibles pour les pizzas
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle garniture</span>
        </button>
      </div>

      {/* Toppings List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loadingToppings ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Chargement des garnitures...</p>
          </div>
        ) : toppings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Aucune garniture trouvée</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Créer la première garniture
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {toppings.map((topping) => (
                  <tr key={topping.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {topping.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        +{topping.price.toFixed(2)} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleAvailable(topping)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          topping.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {topping.is_available ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Disponible
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Indisponible
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(topping)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(topping)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ToppingModal
        isOpen={isModalOpen}
        onClose={closeModal}
        topping={editingTopping}
      />
    </div>
  )
}