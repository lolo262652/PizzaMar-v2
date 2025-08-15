import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { CreditCard, X, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

const PAYMENT_FUNCTION_URL = import.meta.env.VITE_PAYMENT_FUNCTION_URL;

export default function PaymentPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  async function loadOrder() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          users (full_name, phone),
          addresses (street, city, postal_code),
          order_items (*, products (name))
        `
        )
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error(error);
      toast.error("Commande introuvable");
    } finally {
      setLoading(false);
    }
  }

  async function processPayment() {
    setProcessing(true);
    try {
      const res = await fetch(PAYMENT_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), orderId }),
      });
      console.log("PAYMENT_FUNCTION_URL:", PAYMENT_FUNCTION_URL);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");

      window.location.href = data.url; // Redirection Stripe Checkout
    } catch (err) {
      console.error(err);
      toast.error("Impossible de créer la session de paiement");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="ml-3 text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <X className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Commande introuvable</h2>
        <p className="text-gray-600">
          Cette commande n'existe pas ou a expiré.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-6">
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <CreditCard className="w-6 h-6" />
            <span>Paiement de votre commande</span>
          </h1>
          <p className="text-red-100 mt-2">Commande #{order.id.slice(-8)}</p>
        </div>

        <div className="p-6">
          {/* Infos client */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              Informations de livraison
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p>
                <strong>Client :</strong> {order.users.full_name}
              </p>
              <p>
                <strong>Téléphone :</strong> {order.users.phone}
              </p>
              <p>
                <strong>Adresse :</strong> {order.addresses.street},{" "}
                {order.addresses.postal_code} {order.addresses.city}
              </p>
            </div>
          </div>

          {/* Détail commande */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              Détail de la commande
            </h3>
            <div className="space-y-2">
              {order.order_items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b"
                >
                  <div>
                    <span className="font-medium">
                      {item.quantity}x {item.products.name}
                    </span>
                    {item.size && (
                      <span className="text-sm text-gray-600 ml-2">
                        (Taille: {item.size})
                      </span>
                    )}
                    {item.selected_toppings?.length > 0 && (
                      <div className="text-sm text-gray-600">
                        + {item.selected_toppings.join(", ")}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold">
                    {item.total_price.toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total à payer :</span>
              <span className="text-red-600">{amount} €</span>
            </div>
          </div>

          {/* Bouton paiement */}
          <button
            onClick={processPayment}
            disabled={processing}
            className="w-full bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirection vers Stripe...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Payer maintenant</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Paiement sécurisé via Stripe - Vos données sont protégées
          </p>
        </div>
      </div>
    </div>
  );
}
