import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { CreditCard, X, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

const PAYMENT_FUNCTION_URL = import.meta.env.VITE_PAYMENT_FUNCTION_URL;
const BREVO_API_KEY = import.meta.env.VITE_API_BREVO;
const SENDER_EMAIL = "fatmakamg@gmail.com";
const ADMIN_EMAIL = "fatmakamg@gmail.com";

//  Envoi email via Brevo
async function sendBrevoEmail(to: any[], subject: string, htmlContent: string) {
  const payload = {
    sender: { name: "PIZZAMar", email: SENDER_EMAIL },
    to,
    subject,
    htmlContent,
  };
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    console.error("Erreur envoi email :", err);
    throw new Error("Échec d'envoi email");
  }
}

//  Mail client “pending” (avant paiement)
async function sendClientPendingMail(order: any, clientEmail: string) {
  const itemsHtml = order.order_items
    .map((it: any) => {
      const toppings = it.selected_toppings
        ? ` — Toppings : ${it.selected_toppings}`
        : "";
      const size = it.size ? ` — Taille : ${it.size}` : "";
      const crust = it.crust ? ` — Pâte : ${it.crust}` : "";
      return `<li>${it.quantity}x ${
        it.products?.name
      }${size}${crust}${toppings} — ${it.total_price.toFixed(2)}€</li>`;
    })
    .join("");

  if (!clientEmail) return;
  const html = `
    <h2>Commande #${order.id.slice(-8)} enregistrée</h2>
    <p>Bonjour ${order.users.full_name},</p>
    <p>Votre commande est en attente de paiement.</p>
    <p>Total : ${order.total_amount} €</p>
    <p> ${itemsHtml}</p>
    
    <p>${
      order.delivery_method === "delivery"
        ? `Adresse : ${order.addresses.street}, ${order.addresses.postal_code} ${order.addresses.city}`
        : "Retrait en magasin"
    }</p>
    <p>Merci pour votre confiance,<br/>L’équipe PIZZAMar</p>
  `;
  await sendBrevoEmail(
    [{ email: clientEmail, name: order.users.full_name }],
    `Confirmation de commande #${order.id.slice(-8)}`,
    html
  );
}

//  Mail admin “nouvelle commande”
async function sendAdminPendingMail(order: any) {
  const itemsHtml = order.order_items
    .map((it: any) => {
      const toppings = it.selected_toppings
        ? ` — Toppings : ${it.selected_toppings}`
        : "";
      const size = it.size ? ` — Taille : ${it.size}` : "";
      const crust = it.crust ? ` — Pâte : ${it.crust}` : "";
      return `<li>${it.quantity}x ${
        it.products?.name
      }${size}${crust}${toppings} — ${it.total_price.toFixed(2)}€</li>`;
    })
    .join("");

  const addressText =
    order.delivery_method === "delivery" && order.addresses
      ? `Adresse : ${order.addresses.street}, ${order.addresses.postal_code} ${order.addresses.city}`
      : "Retrait en magasin";
  const html = `
    <h2>Nouvelle commande #${order.id.slice(-8)}</h2>
    <p>Client : ${order.users.full_name} (${order.users.email}, ${
    order.users.phone
  })</p>
    <p>Méthode : ${order.delivery_method}</p>
    <p>${addressText}</p>
    <p><strong>Total :</strong> ${order.total_amount} €</p>
    <ul>${itemsHtml}</ul>
  `;
  await sendBrevoEmail(
    [{ email: ADMIN_EMAIL, name: "Admin" }],
    `Nouvelle commande #${order.id.slice(-8)}`,
    html
  );
}

export default function PaymentPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | null>(null);

  //  Récupérer email du client connecté
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setClientEmail(user.email);
    });
  }, []);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      const interval = setInterval(loadOrder, 5000);
      return () => clearInterval(interval);
    }
  }, [orderId, clientEmail]);

  async function loadOrder() {
    if (!clientEmail) return;
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `*, users(full_name,email,phone), addresses(street,city,postal_code), order_items(*,products(name))`
        )
        .eq("id", orderId)
        .single();
      if (error || !data) throw new Error("Commande introuvable");
      setOrder(data);

      //  Email “pending” si pas déjà envoyé
      if (data.status === "pending" && !data.confirmation_sent) {
        await sendClientPendingMail(data, clientEmail);
        await sendAdminPendingMail(data);
        await supabase
          .from("orders")
          .update({ confirmation_sent: true })
          .eq("id", data.id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur chargement commande");
    } finally {
      setLoading(false);
    }
  }

  async function processPayment() {
    if (!order) return;
    setProcessing(true);
    try {
      const res = await fetch(PAYMENT_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(order.total_amount),
          orderId: order.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur inconnue");
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error("Impossible de créer la session de paiement");
      setProcessing(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="ml-3 text-gray-600">Chargement...</p>
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <X className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Commande introuvable</h2>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-red-600 text-white p-6">
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <CreditCard className="w-6 h-6" />
            <span>Paiement de votre commande</span>
          </h1>
          <p className="text-red-100 mt-2">Commande #{order.id.slice(-8)}</p>
          {order.status === "paid" && (
            <p className="mt-2 text-green-300 font-bold">Déjà payée</p>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3">Informations</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p>
              <strong>Client :</strong> {order.users.full_name}
            </p>
            <p>
              <strong>Téléphone :</strong> {order.users.phone}
            </p>
            {order.delivery_method === "delivery" ? (
              <p>
                <strong>Adresse :</strong> {order.addresses.street},{" "}
                {order.addresses.postal_code} {order.addresses.city}
              </p>
            ) : (
              <p>
                <strong>Retrait :</strong> En magasin
              </p>
            )}
          </div>

          <h3 className="text-lg font-semibold mb-3">Détail de la commande</h3>
          <div className="space-y-2 mb-6">
            {order.order_items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between py-2 border-b">
                <span>
                  {item.quantity}x {item.products?.name}
                </span>
                <span>{item.total_price.toFixed(2)} €</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 flex justify-between font-bold text-xl">
            <span>Total à payer :</span>
            <span className="text-red-600">{amount} €</span>
          </div>

          {order.status !== "paid" && (
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
          )}
        </div>
      </div>
    </div>
  );
}
