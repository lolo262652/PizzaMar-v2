// CheckoutModal.tsx
import React, { useState, useEffect } from "react";
import { X, ShoppingBag, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../../stores/cartStore";
import { useAddressStore } from "../../stores/addressStore";
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
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    "delivery"
  );

  const { items, getTotalPrice, clearCart } = useCartStore();
  const { selectedAddress, loadAddresses } = useAddressStore();
  const { user } = useAuthStore();

  const deliveryFee = deliveryMethod === "delivery" ? 3.5 : 0;
  const totalPrice = getTotalPrice();
  const finalTotal = totalPrice + deliveryFee;

  const dingSound = new Audio("/sounds/ding.mp3");

  useEffect(() => {
    if (user?.id && isOpen) loadAddresses(user.id);
  }, [user?.id, isOpen, loadAddresses]);

  const handleCheckout = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (items.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }
    if (deliveryMethod === "delivery" && !selectedAddress) {
      toast.error("Veuillez sélectionner une adresse de livraison");
      return;
    }

    setIsProcessing(true);

    try {
      //  Création de la commande
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          address_id:
            deliveryMethod === "delivery" ? selectedAddress?.id : null,
          total_amount: finalTotal,
          notes: notes.trim() || null,
          status: "pending",
          payment_status: "pending",
          delivery_method: deliveryMethod,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError || !order) {
        toast.error("Erreur lors de la création de la commande");
        console.error(orderError);
        return;
      }

      // Ajout des articles dans order_items
      const orderItemsPayload = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unitPrice) || 0,
        total_price: Number(item.totalPrice) || 0,
        selected_toppings:
          item.selectedToppings.length > 0
            ? item.selectedToppings.map((t) => t.name) // → Tableau pour Supabase
            : null,
        size: item.size || null,
        crust: item.crust || null,
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsPayload);

      if (itemsError) {
        toast.error("Erreur lors de l'ajout des articles à la commande");
        console.error(itemsError);
        return;
      }

      // Son de confirmation
      dingSound.play();

      // Nettoyage du panier et fermeture modal
      clearCart();
      onClose();

      // Redirection vers la page de paiement Stripe
      navigate(`/payment/${order.id}?amount=${finalTotal.toFixed(2)}`);

      toast.success("Commande créée avec succès !");
    } catch (err) {
      console.error("Erreur lors du checkout:", err);
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <ShoppingBag className="w-6 h-6 text-red-600" />
                <span>Finaliser la commande</span>
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
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
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
                >
                  Se connecter
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Mode livraison / retrait */}
                <div className="flex space-x-4">
                  <button
                    className={`flex-1 py-2 rounded-lg font-semibold ${
                      deliveryMethod === "delivery"
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                    onClick={() => setDeliveryMethod("delivery")}
                  >
                    Livraison (+3.5€)
                  </button>
                  <button
                    className={`flex-1 py-2 rounded-lg font-semibold ${
                      deliveryMethod === "pickup"
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                    onClick={() => setDeliveryMethod("pickup")}
                  >
                    Retrait en magasin
                  </button>
                </div>

                {/* Récapitulatif des items */}
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto space-y-3">
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
                            {item.size}
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
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{totalPrice.toFixed(2)} €</span>
                    </div>
                    {deliveryMethod === "delivery" && (
                      <div className="flex justify-between">
                        <span>Livraison</span>
                        <span>{deliveryFee.toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-red-600">
                        {finalTotal.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>

                {deliveryMethod === "delivery" && <AddressSelector compact />}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="Étage, code d'accès, instructions..."
                  />
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={
                    isProcessing ||
                    (deliveryMethod === "delivery" && !selectedAddress)
                  }
                  className="w-full bg-red-600 text-white py-4 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
                >
                  {isProcessing ? "Traitement..." : "Confirmer la commande"}
                </button>
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
