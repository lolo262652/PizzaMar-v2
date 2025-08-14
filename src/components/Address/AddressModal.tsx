import React, { useState, useEffect } from 'react'
import type { Tables } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  editAddress: Tables<'addresses'> | null
  onSave?: () => void
}

export default function AddressModal({ isOpen, onClose, editAddress, onSave }: AddressModalProps) {
  const [title, setTitle] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editAddress) {
      setTitle(editAddress.title)
      setStreet(editAddress.street)
      setCity(editAddress.city)
      setPostalCode(editAddress.postal_code)
    } else {
      setTitle('')
      setStreet('')
      setCity('')
      setPostalCode('')
    }
  }, [editAddress, isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Récupérer user Auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) throw new Error('Utilisateur non connecté')

      // Récupérer l'id dans ta table users personnalisée
      const { data: userRecord, error: userRecordError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userRecordError || !userRecord) {
        throw new Error('Utilisateur non trouvé dans la table users')
      }

      const userIdInUsersTable = userRecord.id

      if (editAddress) {
        const { error } = await supabase
          .from('addresses')
          .update({
            title,
            street,
            city,
            postal_code: postalCode,
          })
          .eq('id', editAddress.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('addresses').insert({
          user_id: userIdInUsersTable,
          title,
          street,
          city,
          postal_code: postalCode,
          is_default: false,
        })

        if (error) throw error
      }

      onSave?.()
      onClose()
    } catch (err) {
      alert(`Erreur : ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-6 w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {editAddress ? "Modifier l'adresse" : 'Ajouter une adresse'}
        </h2>

        <input
          type="text"
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Rue"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          required
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Ville"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Code postal"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          required
          className="border px-3 py-2 rounded w-full"
        />

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
