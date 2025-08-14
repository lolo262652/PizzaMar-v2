import React, { useState, useEffect } from "react";
import { X, CreditCard, ShoppingBag, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../../stores/cartStore";
import { useAddressStore } from "../../stores/addressStore";
import { useOrderStore } from "../../stores/orderStore";
import { useAuthStore } from "../../stores/authStore";
import AddressSelector from "../Address/AddressSelector";
import AuthModal from "../Auth/AuthModal";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { items, getTotalPrice, clearCart } = useCartStore();
  const { selectedAddress, loadAddresses } = useAddressStore();
  const { createOrder } = useOrderStore();
  const { user } = useAuthStore();

  const deliveryFee = 3.5;
  const totalPrice = getTotalPrice();
  const finalTotal = totalPrice + deliveryFee;

  // Charger les adresses si l'utilisateur est connecté et le modal ouvert
  useEffect(() => {
    if (user?.id && isOpen) {
      loadAddresses(user.id);
    }
  }, [user?.id, isOpen, loadAddresses]);

  const handleCheckout = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!selectedAddress) {
      toast.error("Veuillez sélectionner une adresse de livraison");
      return;
    }

    if (items.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }

    setIsProcessing(true);

    try {
      // Vérification utilisateur Supabase
      const { data: result, error } = await supabase.auth.getUser();
      if (error || !result?.user) {
        setShowAuthModal(true);
        return;
      }
      const currentUser = result.user;

      // Préparer les items pour l'insertion
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.basePrice,
        totalPrice: item.totalPrice,
        selectedToppings: item.selectedToppings.map((t) => t.name),
        size: item.size,
        crust: item.crust,
      }));

      // Créer la commande via la fonction createOrder
      const { orderId, error: orderError } = await createOrder({
        userId: currentUser.id,
        addressId: selectedAddress.id,
        items: orderItems,
        totalAmount: finalTotal,
        notes: notes.trim() || undefined,
      });

      if (orderError) {
        toast.error(orderError);
        return;
      }

      if (!orderId) {
        toast.error("Erreur lors de la création de la commande");
        return;
      }

      toast.success("Commande créée avec succès !");
      clearCart();
      onClose();

      // Redirection vers la page de paiement
      navigate(`/payment/${orderId}?amount=${finalTotal.toFixed(2)}`);
    } catch (err) {
      console.error("Erreur lors de la commande :", err);
      toast.error("Erreur lors de la commande");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <ShoppingBag className="w-6 h-6 text-red-600" />
                <span>Finaliser la commande</span>
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!user ? (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Connexion requise
                </h3>
                <p className="text-gray-600 mb-6">
                  Vous devez être connecté pour passer une commande
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Se connecter
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Résumé de la commande */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Résumé de la commande
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <span className="font-medium">
                            {item.quantity}x {item.name}
                          </span>
                          {item.size && (
                            <span className="text-sm text-gray-600 ml-2">
                              {item.size === "small"
                                ? "Petite"
                                : item.size === "medium"
                                ? "Moyenne"
                                : "Grande"}
                            </span>
                          )}
                          {item.selectedToppings.length > 0 && (
                            <div className="text-sm text-gray-600">
                              +{" "}
                              {item.selectedToppings
                                .map((t) => t.name)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-red-600">
                          {item.totalPrice.toFixed(2)} €
                        </span>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between">
                        <span>Sous-total</span>
                        <span>{totalPrice.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Livraison</span>
                        <span>{deliveryFee.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total</span>
                        <span className="text-red-600">
                          {finalTotal.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Adresse */}
                <AddressSelector compact />

                {/* Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Instructions de livraison (optionnel)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Étage, code d'accès, instructions spéciales..."
                  />
                </div>

                {/* Bouton payer */}
                <div className="pt-4">
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || !selectedAddress}
                    className="w-full bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Traitement...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Payer {finalTotal.toFixed(2)} €</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-2">
                    En passant commande, vous acceptez nos conditions de vente
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
