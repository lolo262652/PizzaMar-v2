import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  X,
  RefreshCw,
} from "lucide-react";
import {
  useOrderStore,
  type OrderWithDetails,
} from "../../../stores/orderStore";
import type { Tables } from "../../../lib/supabase";

const statusConfig = {
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
};

export default function OrdersManager() {
  const { orders, loading, loadOrders, updateOrderStatus } = useOrderStore();
  const [selectedStatus, setSelectedStatus] = useState<
    Tables<"orders">["status"] | "all"
  >("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(
    null
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders =
    selectedStatus === "all"
      ? orders
      : orders.filter((order) => order.status === selectedStatus);

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: Tables<"orders">["status"]
  ) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels = {
      pending: "En attente",
      paid: "Payé",
      failed: "Échec",
      refunded: "Remboursé",
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commandes</h1>
          <p className="text-gray-600 mt-2">
            Gérez toutes les commandes de votre pizzeria
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Status Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === "all"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Toutes ({orders.length})
          </button>
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = orders.filter(
              (order) => order.status === status
            ).length;
            return (
              <button
                key={status}
                onClick={() =>
                  setSelectedStatus(status as Tables<"orders">["status"])
                }
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === status
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const config = statusConfig[order.status];
                  const Icon = config.icon;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.order_items.length} article(s)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.users.full_name || "Client"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.users.phone || "Pas de téléphone"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                            order.payment_status
                          )}`}
                        >
                          {getPaymentStatusLabel(order.payment_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.total_amount.toFixed(2)} €
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {order.status !== "delivered" &&
                            order.status !== "cancelled" && (
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  handleStatusUpdate(
                                    order.id,
                                    e.target.value as Tables<"orders">["status"]
                                  )
                                }
                                className="text-xs border border-gray-300 rounded px-1 py-1 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              >
                                <option value="pending">En attente</option>
                                <option value="confirmed">Confirmée</option>
                                <option value="preparing">
                                  En préparation
                                </option>
                                <option value="ready">Prête</option>
                                <option value="delivered">Livrée</option>
                                <option value="cancelled">Annulée</option>
                              </select>
                            )}
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

      {/* Order Details Modal */}
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
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Informations client
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p>
                      <strong>Nom:</strong>{" "}
                      {selectedOrder.users.full_name || "Non renseigné"}
                    </p>
                    <p>
                      <strong>Téléphone:</strong>{" "}
                      {selectedOrder.users.phone || "Non renseigné"}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Articles commandés
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {item.quantity}x {item.products.name}
                            </h4>
                            {item.size && (
                              <p className="text-sm text-gray-600">
                                Taille:{" "}
                                {item.size === "small"
                                  ? "Petite"
                                  : item.size === "medium"
                                  ? "Moyenne"
                                  : "Grande"}
                              </p>
                            )}
                            {item.crust && (
                              <p className="text-sm text-gray-600">
                                Pâte:{" "}
                                {item.crust === "thin"
                                  ? "Fine"
                                  : item.crust === "thick"
                                  ? "Épaisse"
                                  : "Farcie"}
                              </p>
                            )}
                            {item.selected_toppings.length > 0 && (
                              <p className="text-sm text-gray-600">
                                Garnitures: {item.selected_toppings.join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {item.total_price.toFixed(2)} €
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.unit_price.toFixed(2)} € / unité
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Notes</h3>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                      <p className="text-gray-700">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-red-600">
                      {selectedOrder.total_amount.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
