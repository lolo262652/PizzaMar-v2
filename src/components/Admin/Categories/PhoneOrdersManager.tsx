import React, { useState, useEffect } from "react";
import {
  Phone,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  CreditCard,
  Save,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import PhoneOrderModal from "./PhoneOrderModal";
import toast from "react-hot-toast";

interface PhoneOrder {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  users: {
    full_name: string;
    phone: string;
  };
  addresses: {
    title?: string;
    id?: string;
    street: string;
    city: string;
    postal_code: string;
  };
  order_items: Array<{
    quantity: number;
    products: {
      name: string;
    };
  }>;
}

export default function PhoneOrdersManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phoneOrders, setPhoneOrders] = useState<PhoneOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<
    Partial<
      PhoneOrder & {
        users: PhoneOrder["users"];
        addresses: PhoneOrder["addresses"];
      }
    >
  >({});

  useEffect(() => {
    loadPhoneOrders();
  }, []);

  const loadPhoneOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          users (full_name, phone),
          addresses (id, title, street, city,postal_code),
          order_items (
            quantity,
            products (name)
          )
        `
        )
        .ilike("notes", "%téléphonique%")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhoneOrders(data || []);
    } catch (error) {
      console.error("Error loading phone orders:", error);
      toast.error("Erreur lors du chargement des commandes téléphoniques");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (order: PhoneOrder) => {
    setEditingId(order.id);
    setEditData({
      ...order,
      users: { ...order.users },
      addresses: { ...order.addresses },
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: string,
    nested?: "users" | "addresses"
  ) => {
    const value = e.target.value;
    if (nested) {
      setEditData((prev) => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value,
        },
      }));
    } else {
      setEditData((prev) => ({
        ...prev,
        [field]: field === "total_amount" ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const saveChanges = async () => {
    if (!editingId) return;

    try {
      // Mise à jour table orders
      const { error: errorOrder } = await supabase
        .from("orders")
        .update({
          status: editData.status,
          payment_status: editData.payment_status,
          total_amount: editData.total_amount,
        })
        .eq("id", editingId);

      if (errorOrder) throw errorOrder;

      // Mise à jour table users
      if (editData.users) {
        const { error: errorUser } = await supabase
          .from("users")
          .update({
            full_name: editData.users.full_name,
            phone: editData.users.phone,
          })
          .eq("id", phoneOrders.find((o) => o.id === editingId)?.user_id);

        if (errorUser) throw errorUser;
      }

      // Mise à jour table addresses
      if (editData.addresses) {
        const { error: errorAddress } = await supabase
          .from("addresses")
          .update({
            title: editData.addresses.title,
            street: editData.addresses.street,
            city: editData.addresses.city,
            postal_code: editData.addresses.postal_code,
          })
          .eq("id", phoneOrders.find((o) => o.id === editingId)?.addresses?.id);

        if (errorAddress) throw errorAddress;
      }

      toast.success("Modifications enregistrées");
      setEditingId(null);
      setEditData({});
      loadPhoneOrders();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  /** Suppression d’une commande (avec confirmation) */
  const deleteOrder = async (orderId: string) => {
    if (editingId) {
      toast("Terminez/annulez l’édition avant de supprimer.", { icon: "ℹ️" });
      return;
    }
    const ok = window.confirm(
      "Supprimer définitivement cette commande téléphonique ?"
    );
    if (!ok) return;

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      // Option 1: recharger tout
      // await loadPhoneOrders()

      // Option 2: MAJ locale rapide
      setPhoneOrders((prev) => prev.filter((o) => o.id !== orderId));

      toast.success("Commande supprimée.");
    } catch (err) {
      console.error("Erreur suppression commande :", err);
      toast.error("Erreur lors de la suppression.");
    }
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      confirmed: "bg-blue-100 text-blue-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "En attente",
      paid: "Payé",
      failed: "Échec",
      confirmed: "Confirmé",
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Commandes Téléphoniques
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les commandes prises par téléphone
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle commande</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900">
                {phoneOrders.length}
              </p>
            </div>
            <Phone className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente paiement</p>
              <p className="text-2xl font-bold text-yellow-600">
                {
                  phoneOrders.filter((o) => o.payment_status === "pending")
                    .length
                }
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payées</p>
              <p className="text-2xl font-bold text-green-600">
                {phoneOrders.filter((o) => o.payment_status === "paid").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-blue-600">
                {phoneOrders
                  .filter((o) => o.payment_status === "paid")
                  .reduce((sum, o) => sum + o.total_amount, 0)
                  .toFixed(2)}{" "}
                €
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Chargement des commandes...</p>
          </div>
        ) : phoneOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande téléphonique</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Prendre une commande
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande (ID / Qté)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  nouvelle commande
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total (€)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {phoneOrders.map((order) => {
                const isEditing = editingId === order.id;
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    {/* Client */}
                    <td className="px-4 py-2 whitespace-nowrap max-w-xs">
                      {isEditing ? (
                        <div className="flex flex-col space-y-1">
                          <input
                            type="text"
                            className="border rounded px-2 py-1"
                            value={editData.users?.full_name || ""}
                            onChange={(e) =>
                              handleChange(e, "full_name", "users")
                            }
                            placeholder="Nom complet"
                          />
                          <input
                            type="text"
                            className="border rounded px-2 py-1"
                            value={editData.users?.phone || ""}
                            onChange={(e) => handleChange(e, "phone", "users")}
                            placeholder="Téléphone"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {order.users.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.users.phone}
                          </div>
                        </>
                      )}
                    </td>

                    {/* Adresse */}
                    <td className="px-4 py-2 whitespace-nowrap max-w-xs">
                      {isEditing ? (
                        <div className="flex flex-col space-y-1">
                          <input
                            type="text"
                            className="border rounded px-2 py-1"
                            value={editData.addresses?.title || ""}
                            onChange={(e) =>
                              handleChange(e, "title", "addresses")
                            }
                            placeholder="Title"
                          />
                          <input
                            type="text"
                            className="border rounded px-2 py-1"
                            value={editData.addresses?.street || ""}
                            onChange={(e) =>
                              handleChange(e, "street", "addresses")
                            }
                            placeholder="Rue"
                          />
                          <input
                            type="text"
                            className="border rounded px-2 py-1"
                            value={editData.addresses?.city || ""}
                            onChange={(e) =>
                              handleChange(e, "city", "addresses")
                            }
                            placeholder="Ville"
                          />
                          <input
                            type="text"
                            className="border rounded px-2 py-1"
                            value={editData.addresses?.postal_code || ""}
                            onChange={(e) =>
                              handleChange(e, "postal_code", "addresses")
                            }
                            placeholder="Postal code"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-gray-400">
                            {order.addresses.title}
                          </div>
                          <div className="text-sm text-gray-400">
                            {order.addresses.street}
                          </div>
                          <div className="text-sm text-gray-400">
                            {order.addresses.city}
                          </div>
                          <div className="text-sm text-gray-400">
                            {order.addresses.postal_code}
                          </div>
                        </>
                      )}
                    </td>

                    {/* Commande */}
                    <td className="px-4 py-2 whitespace-nowrap max-w-[100px]">
                      <div className="text-sm text-gray-900">
                        #{order.id.slice(-8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.order_items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}{" "}
                        articles
                      </div>
                    </td>

                    {/* nouvelle commande */}
                    <td className="px-4 py-2 whitespace-nowrap max-w-[110px]">
                      {isEditing ? (
                        <select
                          value={editData.status || ""}
                          onChange={(e) => handleChange(e, "status")}
                          className={`text-xs border rounded px-2 py-1 ${getStatusColor(
                            editData.status || ""
                          )}`}
                        >
                          <option value="pending">En attente</option>
                          <option value="paid">Payé</option>
                          <option value="failed">Échec</option>
                          <option value="confirmed">Confirmé</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      )}
                    </td>

                    {/* Paiement */}
                    <td className="px-4 py-2 whitespace-nowrap max-w-[110px]">
                      {isEditing ? (
                        <select
                          value={editData.payment_status || ""}
                          onChange={(e) => handleChange(e, "payment_status")}
                          className={`text-xs border rounded px-2 py-1 ${getStatusColor(
                            editData.payment_status || ""
                          )}`}
                        >
                          <option value="pending">En attente</option>
                          <option value="paid">Payé</option>
                          <option value="failed">Échec</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            order.payment_status
                          )}`}
                        >
                          {getStatusLabel(order.payment_status)}
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-2 whitespace-nowrap max-w-[90px]">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          className="border rounded px-2 py-1 w-full"
                          value={editData.total_amount?.toFixed(2) || "0.00"}
                          onChange={(e) => handleChange(e, "total_amount")}
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {order.total_amount.toFixed(2)} €
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 max-w-[140px]">
                      {formatTime(order.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={saveChanges}
                            className="text-green-600 hover:text-green-900 flex items-center"
                            title="Enregistrer"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            title="Annuler"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing(order)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                            title="Modifier"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <PhoneOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
