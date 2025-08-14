import React, { useState, useEffect } from "react";
import { MapPin, Plus, Edit, Trash2, Check } from "lucide-react";
import { useAddressStore } from "../../stores/addressStore";
import { useAuthStore } from "../../stores/authStore";
import AddressModal from "./AddressModal";
import type { Tables } from "../../lib/supabase";

interface AddressSelectorProps {
  onAddressSelect?: (address: Tables["addresses"]) => void;
  showAddButton?: boolean;
  compact?: boolean;
}

export default function AddressSelector({
  onAddressSelect,
  showAddButton = true,
  compact = false,
}: AddressSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<
    Tables["addresses"] | null
  >(null);

  const { user } = useAuthStore();
  const {
    addresses,
    selectedAddress,
    loading,
    loadAddresses,
    deleteAddress,
    setDefaultAddress,
    selectAddress,
  } = useAddressStore();

  useEffect(() => {
    if (user?.id) {
      loadAddresses(user.id);
    }
  }, [user?.id, loadAddresses]);

  const handleAddressSelect = (address: Tables["addresses"]) => {
    selectAddress(address);
    onAddressSelect?.(address);
  };

  const handleEdit = (address: Tables["addresses"]) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleDelete = async (address: Tables["addresses"]) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette adresse ?")) {
      await deleteAddress(address.id);
      if (user?.id) loadAddresses(user.id);
    }
  };

  const handleSetDefault = async (address: Tables["addresses"]) => {
    await setDefaultAddress(address.id);
    if (user?.id) loadAddresses(user.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const refreshAddresses = () => {
    if (user?.id) loadAddresses(user.id);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Adresse de livraison
        </label>
        <select
          value={selectedAddress?.id || ""}
          onChange={(e) => {
            const address = addresses.find(
              (addr) => addr.id === e.target.value
            );
            if (address) handleAddressSelect(address);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Sélectionner une adresse</option>
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {address.title} - {address.street}, {address.city},
              {address.postal_code}
            </option>
          ))}
        </select>

        {showAddButton && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une adresse</span>
          </button>
        )}

        <AddressModal
          isOpen={isModalOpen}
          onClose={closeModal}
          editAddress={editingAddress}
          onSave={() => {
            refreshAddresses();
            closeModal();
          }}
          userId={user?.id}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-red-600" />
            <span>Adresses de livraison</span>
          </h3>

          {showAddButton && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          )}
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucune adresse enregistrée</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Ajouter votre première adresse
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedAddress?.id === address.id
                    ? "border-red-600 bg-red-50"
                    : "border-gray-200 hover:border-red-300"
                }`}
                onClick={() => handleAddressSelect(address)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {address.title}
                      </h4>
                      {address.is_default && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Par défaut
                        </span>
                      )}
                      {selectedAddress?.id === address.id && (
                        <Check className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{address.street}</p>
                    <p className="text-gray-600 text-sm">
                      {address.postal_code} {address.city}
                    </p>
                  </div>

                  <div className="flex space-x-1 ml-4">
                    {!address.is_default && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(address);
                        }}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Définir par défaut"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(address);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(address);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddressModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editAddress={editingAddress}
        onSave={() => {
          refreshAddresses();
          closeModal();
        }}
        userId={user?.id}
      />
    </>
  );
}
