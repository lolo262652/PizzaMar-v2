import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Tables } from "../lib/supabase";
import toast from "react-hot-toast";

export interface OrderWithDetails extends Tables<"orders"> {
  order_items: Array<Tables<"order_items"> & { products: Tables<"products"> }>;
  addresses: Tables<"addresses">;
  users: Pick<Tables<"users">, "full_name" | "phone">;
}

interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedToppings: string[];
  size?: "small" | "medium" | "large";
  crust?: "thin" | "thick" | "stuffed";
}

interface CreateOrderParams {
  addressId: string;
  items: OrderItemInput[];
  totalAmount: number;
  notes?: string;
}

interface OrderState {
  orders: OrderWithDetails[];
  userOrders: OrderWithDetails[];
  loading: boolean;
  loadOrders: () => Promise<void>;
  loadUserOrders: (userId: string) => Promise<void>;
  createOrder: (orderData: CreateOrderParams) => Promise<{ orderId?: string; error?: string }>;
  updateOrderStatus: (
    orderId: string,
    status: Tables<"orders">["status"]
  ) => Promise<{ error?: string }>;
  updatePaymentStatus: (
    orderId: string,
    paymentStatus: Tables<"orders">["payment_status"],
    stripeSessionId?: string
  ) => Promise<{ error?: string }>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  userOrders: [],
  loading: false,

  /** Charger toutes les commandes (admin) */
  loadOrders: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*, products (*)),
          addresses (*),
          users (full_name, phone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ orders: data || [], loading: false });
    } catch (err) {
      console.error("Erreur loadOrders:", err);
      toast.error("Erreur lors du chargement des commandes");
      set({ loading: false });
    }
  },

  /** Charger les commandes d’un utilisateur */
  loadUserOrders: async (userId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*, products (*)),
          addresses (*),
          users (full_name, phone)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ userOrders: data || [], loading: false });
    } catch (err) {
      console.error("Erreur loadUserOrders:", err);
      toast.error("Erreur lors du chargement de vos commandes");
      set({ loading: false });
    }
  },

  /** Créer une commande */
  createOrder: async (orderData) => {
    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError || !userResult?.user) {
        return { error: "Utilisateur non connecté" };
      }

      const userId = userResult.user.id;

      // 1️⃣ Création de la commande
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          address_id: orderData.addressId,
          total_amount: orderData.totalAmount,
          status: "pending",
          payment_status: "pending",
          notes: orderData.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2️⃣ Ajout des articles
      const orderItemsPayload = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        selected_toppings: item.selectedToppings,
        size: item.size || null,
        crust: item.crust || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsPayload);

      if (itemsError) throw itemsError;

      toast.success("Commande créée avec succès");
      return { orderId: order.id };
    } catch (err: any) {
      console.error("Erreur createOrder:", err);
      const errorMessage = err.message || "Erreur lors de la création de la commande";
      toast.error(errorMessage);
      return { error: errorMessage };
    }
  },

  /** Mettre à jour le statut de commande */
  updateOrderStatus: async (orderId, status) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      await get().loadOrders();

      // Notification client
      const { data: order } = await supabase
        .from("orders")
        .select("user_id")
        .eq("id", orderId)
        .single();

      if (order) {
        const statusMessages: Record<string, string> = {
          confirmed: "Votre commande a été confirmée",
          preparing: "Votre commande est en préparation",
          ready: "Votre commande est prête",
          delivered: "Votre commande a été livrée",
          cancelled: "Votre commande a été annulée",
        };

        await supabase.from("notifications").insert({
          user_id: order.user_id,
          order_id: orderId,
          type:
            status === "ready"
              ? "order_ready"
              : status === "delivered"
              ? "order_delivered"
              : "order_confirmed",
          title: "Mise à jour de commande",
          message: statusMessages[status] || "Statut de commande mis à jour",
        });
      }

      toast.success("Statut de commande mis à jour");
      return {};
    } catch (err: any) {
      console.error("Erreur updateOrderStatus:", err);
      return { error: err.message || "Erreur lors de la mise à jour" };
    }
  },

  /** Mettre à jour le statut de paiement */
  updatePaymentStatus: async (orderId, paymentStatus, stripeSessionId) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          payment_status: paymentStatus,
          stripe_session_id: stripeSessionId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      if (paymentStatus === "paid") {
        await get().updateOrderStatus(orderId, "confirmed");
      }

      return {};
    } catch (err: any) {
      console.error("Erreur updatePaymentStatus:", err);
      return { error: err.message || "Erreur lors de la mise à jour du paiement" };
    }
  },
}));
