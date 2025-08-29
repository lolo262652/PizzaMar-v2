// ------------------------------------------------------------
// Ajout dans Supabase (si ce n’est pas déjà fait)
// ------------------------------------------------------------
/*
ALTER TABLE public.orders
ADD COLUMN preparing_confirmation_sent boolean DEFAULT false,
ADD COLUMN ready_confirmation_sent boolean DEFAULT false,
ADD COLUMN delivered_confirmation_sent boolean DEFAULT false;
*/

// ------------------------------------------------------------
// Composant OrdersManager mis à jour
// ------------------------------------------------------------
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ShoppingCart,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  X,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import {
  useOrderStore,
  type OrderWithDetails,
} from "../../../stores/orderStore";
import toast from "react-hot-toast";
import type { Tables } from "../../../lib/supabase";

// ------------------------------------------------------------
// Types & helpers
// ------------------------------------------------------------
type OrderStatus = Tables["orders"]["status"];

type RealtimeState = {
  connected: boolean;
  lastEventAt: string | null;
  reconnecting: boolean;
};

const classNames = (...cx: (string | false | null | undefined)[]) =>
  cx.filter(Boolean).join(" ");

const statusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  pending: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmée",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  preparing: {
    label: "En préparation",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: RefreshCw,
  },
  ready: {
    label: "Prête",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  delivered: {
    label: "Livrée",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Truck,
  },
  cancelled: {
    label: "Annulée",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: X,
  },
  completed: {
    label: "Terminée",
    color: "bg-green-200 text-green-900 border-green-300",
    icon: CheckCircle,
  },
};

const formatTime = (dateString?: string) =>
  dateString
    ? new Date(dateString).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const getPaymentStatusColor = (status: string) =>
  ({
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  }[status] ?? "bg-gray-100 text-gray-800");

const getPaymentStatusLabel = (status: string) =>
  ({
    pending: "En attente",
    paid: "Payé",
    failed: "Échec",
    refunded: "Remboursé",
  }[status] ?? status);

function playSound(src: string) {
  const audio = new Audio(src);
  audio.play().catch((e) => console.warn("Audio play blocked:", e));
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={classNames(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
        className
      )}
    >
      {children}
    </span>
  );
}

function ConnectionBadge({
  connected,
  reconnecting,
  lastEventAt,
}: RealtimeState) {
  return (
    <div className="flex items-center gap-2">
      <Badge
        className={
          connected
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-red-100 text-red-800 border-red-200"
        }
      >
        {connected ? (
          <Wifi className="w-3 h-3 mr-1" />
        ) : (
          <WifiOff className="w-3 h-3 mr-1" />
        )}
        {connected
          ? "Realtime connecté"
          : reconnecting
          ? "Reconnexion…"
          : "Hors ligne Realtime"}
      </Badge>
      {lastEventAt && (
        <Badge className="bg-gray-50 text-gray-600 border-gray-200">
          Dernier évènement: {formatTime(lastEventAt)}
        </Badge>
      )}
    </div>
  );
}

const RealtimeContext = createContext<RealtimeState | null>(null);

export function SupabaseRealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<RealtimeState>({
    connected: false,
    lastEventAt: null,
    reconnecting: false,
  });
  const channelRef = useRef<any>(null);
  const retryTimer = useRef<any>(null);

  const setup = useCallback(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase.channel("orders_and_items_changes");

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => setState((s) => ({ ...s, lastEventAt: new Date().toISOString() }))
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => setState((s) => ({ ...s, lastEventAt: new Date().toISOString() }))
      );

    channel
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED")
          setState({ connected: true, lastEventAt: null, reconnecting: false });
      })
      .on("error", () => {
        setState({ connected: false, lastEventAt: null, reconnecting: true });
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(setup, 1200);
      })
      .on("close", () => {
        setState({ connected: false, lastEventAt: null, reconnecting: true });
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(setup, 1200);
      });

    channelRef.current = channel;
  }, []);

  useEffect(() => {
    setup();
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [setup]);

  return (
    <RealtimeContext.Provider value={state}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeConnection() {
  const ctx = useContext(RealtimeContext);
  return ctx ?? { connected: false, lastEventAt: null, reconnecting: false };
}

// ------------------------------------------------------------
// Envoi email Brevo
// ------------------------------------------------------------
async function sendOrderEmail(
  order: any,
  type: "preparing" | "ready" | "delivered"
) {
  if (!order?.users?.email) return;

  const texts = {
    preparing: {
      subject: `Votre commande #${order.id.slice(-8)} est en préparation`,
      message: `Nous préparons votre commande. Elle sera bientôt prête`,
    },
    ready: {
      subject: `Votre commande #${order.id.slice(-8)} est prête`,
      message: `Votre commande est prête à être récupérée ou livrée. Merci pour votre confiance`,
    },
    delivered: {
      subject: `Votre commande #${order.id.slice(-8)} a été livrée`,
      message: `Votre commande a été livrée. Merci d’avoir choisi PIZZAMar`,
    },
  };

  const t = texts[type];
  const addressText =
    order.delivery_method === "delivery" && order.addresses
      ? `Adresse : ${order.addresses.street}, ${order.addresses.postal_code} ${order.addresses.city}`
      : "Retrait en magasin";

  const payload = {
    sender: { name: "PIZZAMar", email: "fatmakamg@gmail.com" },
    to: [{ email: order.users.email, name: order.users.full_name }],
    subject: t.subject,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; font-size:16px; color:#333;">
        <h2 style="color:#16a34a;">${t.subject}</h2>
        <p>Bonjour ${order.users.full_name},</p>
        <p>${t.message}</p>
        <div style="margin:1rem 0; padding:1rem; background:#f0fdf4; border-left:4px solid #16a34a;">
          Montant total : <strong>${order.total_amount} €</strong><br/>
          Adresse :<p> ${addressText}</p>
        </div>
        <p>Merci d’avoir choisi PIZZAMar !</p>
        <p style="font-size:13px; color:#666;">(Message automatique)</p>
      </div>
    `,
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": import.meta.env.VITE_API_BREVO,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("Erreur email", await res.json());
    toast.error("Échec envoi email " + type);
  } else {
    toast.success(`Email "${type}" envoyé ✅`);
  }
}

// ------------------------------------------------------------
// OrdersManager
// ------------------------------------------------------------
export default function OrdersManager() {
  const {
    orders,
    loading,
    updateOrderStatus: storeUpdateOrderStatus,
    loadOrders,
  } = useOrderStore();
  const { connected, reconnecting, lastEventAt } = useRealtimeConnection();

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">(
    "all"
  );
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(
    null
  );
  const [isRefetching, setIsRefetching] = useState(false);

  const localUpdatesRef = useRef<Set<string>>(new Set());

  const filteredOrders = useMemo(
    () =>
      selectedStatus === "all"
        ? orders
        : orders.filter((o) => o.status === selectedStatus),
    [orders, selectedStatus]
  );

  const gentleRefetchAll = useCallback(async () => {
    setIsRefetching(true);
    try {
      await loadOrders();
    } finally {
      setIsRefetching(false);
    }
  }, [loadOrders]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) gentleRefetchAll();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [gentleRefetchAll]);

  // ✅ Handle Status Update avec envoi email Preparing, Ready & Delivered
  // ✅ Handle Status Update avec envoi email Preparing, Ready & Delivered
  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      localUpdatesRef.current.add(orderId);

      try {
        // Charger la commande existante
        const { data, error } = await supabase
          .from("orders")
          .select(
            "*, users(full_name,email), addresses(street,city,postal_code), preparing_confirmation_sent, ready_confirmation_sent, delivered_confirmation_sent"
          )
          .eq("id", orderId)
          .single();
        if (error) throw error;

        let finalStatus = newStatus;

        // Si la commande est en attente et qu'on tente préparation, passer à confirmée d'abord
        if (data.status === "pending" && newStatus === "preparing") {
          finalStatus = "confirmed";
          await supabase
            .from("orders")
            .update({ status: finalStatus })
            .eq("id", orderId);
          toast.success("Commande confirmée automatiquement");
        }

        // Mise à jour du statut final (preparing, ready, delivered)
        await supabase
          .from("orders")
          .update({ status: newStatus })
          .eq("id", orderId);

        // Email Preparing
        if (newStatus === "preparing" && !data.preparing_confirmation_sent) {
          await sendOrderEmail(data, "preparing");
          await supabase
            .from("orders")
            .update({ preparing_confirmation_sent: true })
            .eq("id", orderId);
        }

        // Email Ready
        if (newStatus === "ready" && !data.ready_confirmation_sent) {
          await sendOrderEmail(data, "ready");
          await supabase
            .from("orders")
            .update({ ready_confirmation_sent: true })
            .eq("id", orderId);
        }

        // Email Delivered
        if (newStatus === "delivered" && !data.delivered_confirmation_sent) {
          await sendOrderEmail(data, "delivered");
          await supabase
            .from("orders")
            .update({ delivered_confirmation_sent: true })
            .eq("id", orderId);
        }

        if (newStatus === "pending") playSound("/sounds/ding.mp3");
        if (newStatus === "confirmed") playSound("/sounds/ding.mp3");
        if (newStatus === "preparing") playSound("/sounds/ding.mp3");
        if (newStatus === "ready") playSound("/sounds/ding.mp3");
        if (newStatus === "delivered") playSound("/sounds/ding.mp3");
        if (newStatus === "cancelled") playSound("/sounds/ding.mp3");
        if (newStatus === "completed") playSound("/sounds/ding.mp3");

        await loadOrders();
        toast.success("Statut mis à jour");
      } catch (err: any) {
        console.error("Erreur updateOrderStatus:", err);
        toast.error(err?.message || "Erreur mise à jour statut");
      } finally {
        setTimeout(() => localUpdatesRef.current.delete(orderId), 800);
      }
    },
    [loadOrders]
  );

  // Realtime subscription
  useEffect(() => {
    const ch = supabase
      .channel("orders_and_items_bind")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload: any) => {
          const id = (payload.new ?? payload.old)?.id;
          if (!id) return;
          if (localUpdatesRef.current.has(id)) return;

          if (payload.eventType === "INSERT") {
            playSound("/sounds/ding.mp3");
            await loadOrders();
            return;
          }

          if (payload.eventType === "DELETE") {
            await loadOrders();
            return;
          }

          if (payload.eventType === "UPDATE") {
            const oldStatus = payload.old?.status;
            const newStatus = payload.new?.status;
            if (oldStatus !== newStatus) {
              if (
                [
                  "pending",
                  "completed",
                  "confirmed",
                  "preparing",
                  "ready",
                  "delivered",
                  "cancelled",
                  "completed",
                ].includes(newStatus)
              )
                playSound("/sounds/ding.mp3");
            }
            await loadOrders();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        async () => {
          await loadOrders();
        }
      )
      .subscribe();

    loadOrders();

    return () => supabase.removeChannel(ch);
  }, [loadOrders]);

  // ------------------- Rendu UI -------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commandes</h1>
          <p className="text-gray-600 mt-2">
            Gérez toutes les commandes de votre pizzeria
          </p>
          <ConnectionBadge
            connected={connected}
            reconnecting={reconnecting}
            lastEventAt={lastEventAt}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={gentleRefetchAll}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>
              {isRefetching || loading ? "Chargement..." : "Actualiser"}
            </span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus("all")}
          className={classNames(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            selectedStatus === "all"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          Toutes ({orders.length})
        </button>

        {Object.entries(statusConfig).map(([status, config]) => {
          const count = orders.filter((o) => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status as OrderStatus)}
              className={classNames(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                selectedStatus === status
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="animate-spin w-8 h-8 text-red-600 mx-auto" />
            <p className="text-gray-600 mt-2">Chargement des commandes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const config =
                    statusConfig[order.status] ?? statusConfig.pending;
                  const Icon = config.icon ?? Clock;
                  const user = order.users ?? {
                    full_name: "Client",
                    phone: "-",
                  };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.order_items?.length ?? 0} article(s)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={config.color}>
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={classNames(
                            "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                            getPaymentStatusColor(order.payment_status)
                          )}
                        >
                          {getPaymentStatusLabel(order.payment_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {order.total_amount?.toFixed(2) ?? 0} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusUpdate(
                                order.id,
                                e.target.value as OrderStatus
                              )
                            }
                            className="text-xs border border-gray-300 rounded px-1 py-1 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                          >
                            {Object.entries(statusConfig).map(([key, cfg]) => (
                              <option key={key} value={key}>
                                {cfg.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal détails commande */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Commande #{selectedOrder.id.slice(-8)}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Client</h3>
                  <p>{selectedOrder.users?.full_name}</p>
                  <p>{selectedOrder.users?.email}</p>
                  <p>{selectedOrder.users?.phone}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Adresse</h3>
                  <p>{selectedOrder.addresses?.street}</p>
                  <p>
                    {selectedOrder.addresses?.postal_code}{" "}
                    {selectedOrder.addresses?.city}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Articles</h3>
                  <ul className="list-disc pl-5">
                    {selectedOrder.order_items?.map((item) => (
                      <li key={item.id}>
                        {item.name} x {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
