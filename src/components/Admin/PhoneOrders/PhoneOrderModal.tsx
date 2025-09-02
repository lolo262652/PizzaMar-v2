import React, { useEffect, useMemo, useState } from "react";
import { X, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../../lib/supabase";
import { useAdminStore } from "../../../stores/adminStore";
import toast from "react-hot-toast";

// ---------------------- Schemas ----------------------
const customerSchema = z.object({
  phone: z.string().min(10, "Le numéro doit contenir au moins 10 chiffres"),
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
});

const addressSchema = z.object({
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères"),
  street: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  postal_code: z
    .string()
    .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
});

type CustomerForm = z.infer<typeof customerSchema>;
type AddressForm = z.infer<typeof addressSchema>;

// ---------------------- Types ----------------------
interface PhoneOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (order: PhoneOrder) => void;
}
type Topping = { id: string; name: string; price: number };

interface CartItem {
  id: string;
  productId: string;
  name: string;
  image?: string | null;
  basePrice: number;
  quantity: number;
  size?: "small" | "medium" | "large";
  crust?: string | null;
  selectedToppings: Topping[];
  totalPrice: number;
  isPizza: boolean;
}

// ---------------------- Component ----------------------
export default function PhoneOrderModal({
  isOpen,
  onClose,
}: PhoneOrderModalProps) {
  const [step, setStep] = useState<
    "phone" | "customer" | "address" | "products" | "payment"
  >("phone");
  const [existingCustomer, setExistingCustomer] = useState<any>(null);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const {
    products,
    categories,
    toppings,
    loadProducts,
    loadCategories,
    loadToppings,
  } = useAdminStore();

  const [customizingProduct, setCustomizingProduct] = useState<any | null>(
    null
  );
  const [customization, setCustomization] = useState<{
    quantity: number;
    size?: "small" | "medium" | "large";
    crust?: string | null;
    toppings: Record<string, boolean>;
  }>({ quantity: 1, size: "medium", crust: null, toppings: {} });

  const phoneForm = useForm<{ phone: string }>({
    defaultValues: { phone: "" },
  });
  const customerForm = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: { phone: "", full_name: "", email: "" },
  });
  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: { title: "Domicile", street: "", city: "", postal_code: "" },
  });

  // ---------------------- Load data ----------------------
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      loadCategories();
      loadToppings();
    }
  }, [isOpen, loadProducts, loadCategories, loadToppings]);

  // ---------------------- Sound effect ----------------------
  const playSound = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch((err) => console.error("Erreur son:", err));
  };
  // ---------------------- Remove from cart ----------------------
  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
    toast.success("Produit supprimé du panier");
    playSound("/sounds/ding.mp3"); // Son suppression
  };

  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    "delivery"
  );

  // ---------------------- Realtime order listener ----------------------
  useEffect(() => {
    if (!currentOrderId) return;

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const record = payload.record;
          if (record.id === currentOrderId) {
            setOrderStatus(record.status);
            setPaymentStatus(record.payment_status);
            toast.success(
              `État de la commande mis à jour: ${record.status}, paiement: ${record.payment_status}`
            );
            playSound("/sounds/ding.mp3");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrderId]);

  // ---------------------- Customer lookup & creation ----------------------
  const searchCustomerByPhone = async (phone: string) => {
    try {
      const { data: customer, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .maybeSingle();

      if (error) throw error;

      if (customer) {
        setExistingCustomer(customer);

        const { data: addresses } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", customer.id)
          .order("is_default", { ascending: false });

        setCustomerAddresses(addresses || []);
        setSelectedAddress((addresses && addresses[0]) || null);

        setStep(addresses && addresses.length ? "products" : "address");
      } else {
        setExistingCustomer(null);
        customerForm.setValue("phone", phone);
        setStep("customer");
      }
    } catch (err) {
      console.error("Error searching customer:", err);
      toast.error("Erreur lors de la recherche du client");
    }
  };

  const createCustomer = async (data: CustomerForm) => {
    try {
      const { data: result, error } = await supabase.functions.invoke(
        "create-phone-user",
        {
          body: {
            phone: data.phone,
            full_name: data.full_name,
            email: data.email,
          },
        }
      );

      if (error) throw error;
      if (!result.success) throw new Error(result.error || "Erreur inconnue");

      setExistingCustomer(result.user);
      setStep("address");
      toast.success("Client créé avec succès");
      playSound("/sounds/ding.mp3");
    } catch (err: any) {
      console.error("Error creating customer:", err);
      toast.error(err?.message || "Erreur lors de la création du client");
    }
  };

  const createAddress = async (data: AddressForm) => {
    try {
      if (!existingCustomer || !existingCustomer.id)
        throw new Error("Client non trouvé ou invalide.");

      const addressData = {
        user_id: existingCustomer.id,
        title: data.title.trim(),
        street: data.street.trim(),
        city: data.city.trim(),
        postal_code: data.postal_code.trim(),
        is_default: customerAddresses.length === 0,
      };

      const { data: insertedAddress, error } = await supabase
        .from("addresses")
        .insert(addressData)
        .select()
        .single();

      if (error) throw error;

      setSelectedAddress(insertedAddress);
      setCustomerAddresses((prev) => [...prev, insertedAddress]);
      setStep("products");
      toast.success("Adresse ajoutée avec succès");
    } catch (err: any) {
      console.error("Erreur lors de la création d'adresse :", err);
      toast.error(err?.message || "Erreur lors de la création de l'adresse");
    }
  };

  // ---------------------- Cart management ----------------------
  const calculateItemPrice = (
    product: any,
    opts?: { quantity?: number; size?: string; toppings?: Topping[] }
  ) => {
    let price = product.base_price;
    if (product.is_pizza && opts?.size) {
      const sizeMultipliers: Record<string, number> = {
        small: 0.8,
        medium: 1,
        large: 1.3,
      };
      price = price * (sizeMultipliers[opts.size] ?? 1);
    }
    if (opts?.toppings && opts.toppings.length) {
      price += opts.toppings.reduce((s, t) => s + (t.price || 0), 0);
    }
    return price * (opts?.quantity || 1);
  };

  const addToCart = (
    product: any,
    opts?: {
      quantity?: number;
      size?: "small" | "medium" | "large";
      crust?: string | null;
      toppings?: Topping[];
    }
  ) => {
    const quantity = opts?.quantity ?? 1;
    const selectedToppings = opts?.toppings ?? [];
    const totalPrice = calculateItemPrice(product, {
      quantity,
      size: opts?.size,
      toppings: selectedToppings,
    });

    const item: CartItem = {
      id: `${product.id}_${Date.now()}`,
      productId: product.id,
      name: product.name,
      image: product.image_url || product.image || null,
      basePrice: product.base_price,
      quantity,
      size: opts?.size,
      crust: opts?.crust ?? null,
      selectedToppings,
      totalPrice,
      isPizza: !!product.is_pizza,
    };

    setCart((prev) => [...prev, item]);
    toast.success(`${product.name} ajouté au panier`);
    playSound("/sounds/ding.mp3"); // Ding au ajout produit
  };

  const getTotalPrice = useMemo(
    () => () => cart.reduce((sum, item) => sum + item.totalPrice, 0),
    [cart]
  );

  // ---------------------- Customization flow ----------------------
  const openCustomize = (product: any) => {
    const map: Record<string, boolean> = {};
    (toppings || []).forEach((t) => {
      map[t.id] = false;
    });
    setCustomization({
      quantity: 1,
      size: "medium",
      crust: product.default_crust || null,
      toppings: map,
    });
    setCustomizingProduct(product);
  };

  const toggleTopping = (toppingId: string) => {
    setCustomization((prev) => ({
      ...prev,
      toppings: { ...prev.toppings, [toppingId]: !prev.toppings[toppingId] },
    }));
  };

  const confirmCustomization = () => {
    if (!customizingProduct) return;
    const selected: Topping[] = (toppings || [])
      .filter((t: any) => customization.toppings[t.id])
      .map((t: any) => ({ id: t.id, name: t.name, price: t.price }));

    addToCart(customizingProduct, {
      quantity: customization.quantity,
      size: customization.size,
      crust: customization.crust,
      toppings: selected,
    });
    setCustomizingProduct(null);
  };

  // ---------------------- Order creation ----------------------
  const createOrderAndPaymentLink = async () => {
    if (!existingCustomer || cart.length === 0) {
      toast.error("Vérifiez le client et le panier");
      return;
    }

    if (deliveryMethod === "delivery" && !selectedAddress) {
      toast.error("Veuillez sélectionner une adresse de livraison");
      return;
    }

    setIsProcessing(true);
    try {
      const totalAmount =
        getTotalPrice() + (deliveryMethod === "delivery" ? 3.5 : 0);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: existingCustomer.id,
          address_id:
            deliveryMethod === "delivery" ? selectedAddress?.id : null,
          total_amount: totalAmount,
          status: "pending",
          payment_status: "pending",
          notes:
            deliveryMethod === "pickup"
              ? "Commande avec retrait en magasin"
              : "Commande téléphonique",
          delivery_method: deliveryMethod, // 👈 ajoute un champ dans ta table orders
        })
        .select()
        .single();

      if (orderError) throw orderError;

      setCurrentOrderId(order.id);
      setOrderStatus(order.status);
      setPaymentStatus(order.payment_status);

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.basePrice,
        total_price: item.totalPrice,
        selected_toppings: item.selectedToppings.map((t) => t.name),
        size: item.size || null,
        crust: item.crust || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) throw itemsError;

      const paymentUrl = `${window.location.origin}/payment/${
        order.id
      }?amount=${totalAmount.toFixed(2)}`;
      setPaymentLink(paymentUrl);

      await supabase.from("notifications").insert({
        user_id: existingCustomer.id,
        order_id: order.id,
        type: "general",
        title: "Lien de paiement",
        message: `Votre commande est prête ! ${paymentUrl}`,
      });

      setStep("payment");
      toast.success("Commande créée et lien de paiement généré");
      playSound("/sounds/ding.mp3"); // Ding création commande
    } catch (err) {
      console.error("Error creating order:", err);
      toast.error("Erreur lors de la création de la commande");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendPaymentLink = async () => {
    if (!paymentLink || !existingCustomer) return;

    try {
      // Préparer les données pour l'API Brevo Transactional SMS
      const smsData = {
        sender: "Company", // ⚠️ doit être validé chez Brevo sinon remplacé
        recipient: existingCustomer.phone, // Numéro au format international (+216...)
        content: `Bonjour, voici votre lien de paiement : ${paymentLink}`,
        type: "transactional", // Obligatoire pour éviter l’envoi en campagne
        tag: "payment-link", // Optionnel, utile pour le suivi
      };

      // Appel API Brevo Transactional SMS
      const response = await fetch(
        "https://api.brevo.com/v3/transactionalSMS/sms",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": import.meta.env.VITE_API_BREVO_SMS, // même clé API que pour email
          },
          body: JSON.stringify(smsData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(`Lien de paiement envoyé au ${existingCustomer.phone}`);
        playSound("/sounds/ding.mp3"); // Ding paiement
        setTimeout(() => {
          onClose();
          resetModal();
        }, 1000);
      } else {
        toast.error(`Erreur envoi SMS: ${result.message || "Réessayez."}`);
        console.error("Brevo SMS error:", result);
      }
    } catch (error) {
      console.error("Erreur envoi SMS:", error);
      toast.error("Impossible d'envoyer le SMS.");
    }
  };

  const resetModal = () => {
    setStep("phone");
    setExistingCustomer(null);
    setCustomerAddresses([]);
    setSelectedAddress(null);
    setCart([]);
    setPaymentLink("");
    setOrderStatus("pending");
    setPaymentStatus("pending");
    setCurrentOrderId(null);
    phoneForm.reset();
    customerForm.reset();
    addressForm.reset();
    setCustomizingProduct(null);
  };

  // ---------------------- Render ----------------------
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Phone className="w-6 h-6 text-red-600" />
              <span>Prise de commande téléphonique</span>
            </h2>
            <button
              onClick={() => {
                onClose();
                resetModal();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Steps indicator */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              {["phone", "customer", "address", "products", "payment"].map(
                (s, i) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step === s
                          ? "bg-red-600 text-white"
                          : [
                              "phone",
                              "customer",
                              "address",
                              "products",
                              "payment",
                            ].indexOf(step) > i
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < 4 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
                  </div>
                )
              )}
            </div>
          </div>

          {/* --- PHONE --- */}
          {step === "phone" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Recherche client par téléphone
              </h3>
              <form
                onSubmit={phoneForm.handleSubmit((data) =>
                  searchCustomerByPhone(data.phone)
                )}
              >
                <div className="flex space-x-4">
                  <input
                    {...phoneForm.register("phone")}
                    type="tel"
                    placeholder="Numéro de téléphone: +33616364106"
                    className="flex-1 px-4 py-2 border rounded-lg"
                  />
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-6 py-2 rounded-lg"
                  >
                    Rechercher
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --- CUSTOMER --- */}
          {step === "customer" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Nouveau client</h3>
              <form
                onSubmit={customerForm.handleSubmit(createCustomer)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <input
                    {...customerForm.register("full_name")}
                    placeholder="Nom complet *"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    {...customerForm.register("phone")}
                    placeholder="Téléphone *"
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <input
                  {...customerForm.register("email")}
                  placeholder="Email (optionnel)"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-2 rounded-lg"
                >
                  Créer le client
                </button>
              </form>
            </div>
          )}

          {/* --- ADDRESS --- */}
          {step === "address" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mode de livraison</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => setDeliveryMethod("delivery")}
                  className={`px-4 py-2 rounded-lg border ${
                    deliveryMethod === "delivery"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Livraison à domicile
                </button>
                <button
                  onClick={() => {
                    setDeliveryMethod("pickup");
                    setSelectedAddress(null); // pas besoin d’adresse
                    setStep("products");
                  }}
                  className={`px-4 py-2 rounded-lg border ${
                    deliveryMethod === "pickup"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Retrait en magasin
                </button>
              </div>

              {deliveryMethod === "delivery" && (
                <>
                  {customerAddresses.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">
                        Adresses existantes :
                      </h4>
                      {customerAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddress(addr);
                            setStep("products");
                          }}
                          className="block w-full text-left p-3 border rounded-lg mb-2"
                        >
                          <div className="font-medium">{addr.title}</div>
                          <div className="text-sm text-gray-600">
                            {addr.street}, {addr.city}, {addr.postal_code}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <form
                    onSubmit={addressForm.handleSubmit(createAddress)}
                    className="space-y-4"
                  >
                    <h4 className="font-medium">Nouvelle adresse :</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        {...addressForm.register("title")}
                        placeholder="Titre (Domicile, Bureau...)"
                        className="px-4 py-2 border rounded-lg"
                      />
                      <input
                        {...addressForm.register("postal_code")}
                        placeholder="Code postal"
                        className="px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <input
                      {...addressForm.register("street")}
                      placeholder="Adresse complète"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      {...addressForm.register("city")}
                      placeholder="Ville"
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <button
                      type="submit"
                      className="w-full bg-red-600 text-white py-2 rounded-lg"
                    >
                      Ajouter l'adresse
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* --- PRODUCTS --- */}
          {step === "products" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Sélection des produits
                </h3>
                <div className="text-sm text-gray-600">
                  Panier: {cart.length} articles - {getTotalPrice().toFixed(2)}{" "}
                  €
                </div>
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium mb-2">Panier actuel :</h4>

                  {/* Liste des articles */}
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border-b py-2"
                    >
                      <div className="flex items-center space-x-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          {item.isPizza && (
                            <div className="text-sm text-gray-600">
                              Taille : {item.size}, Quantité : {item.quantity}
                            </div>
                          )}
                          {item.selectedToppings.length > 0 && (
                            <div className="text-sm text-gray-600">
                              Garnitures :{" "}
                              {item.selectedToppings
                                .map((t) => t.name)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="font-semibold">
                          {item.totalPrice.toFixed(2)} €
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer du panier"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Récap total */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>Total produits :</span>
                      <span>{getTotalPrice().toFixed(2)} €</span>
                    </div>
                    {deliveryMethod === "delivery" && (
                      <div className="flex justify-between font-semibold">
                        <span>Livraison :</span>
                        <span>3.50 €</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total à payer :</span>
                      <span>
                        {(
                          getTotalPrice() +
                          (deliveryMethod === "delivery" ? 3.5 : 0)
                        ).toFixed(2)}{" "}
                        €
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Grid */}
              <div className="grid grid-cols-3 gap-4 max-h-[350px] overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-lg p-3 flex flex-col items-center text-center"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-24 h-24 object-cover mb-2 rounded"
                      />
                    )}
                    <h4 className="font-semibold">{product.name}</h4>
                    <div className="text-red-600 font-bold mb-2">
                      {product.base_price.toFixed(2)} €
                    </div>

                    {/* Personnaliser bouton uniquement pour pizzas */}
                    {product.is_pizza ? (
                      <button
                        onClick={() => openCustomize(product)}
                        className="mt-auto bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Personnaliser
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="mt-auto bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Ajouter
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Passer commande */}
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setStep("address");
                  }}
                  className="bg-gray-300 text-gray-700 px-5 py-2 rounded hover:bg-gray-400"
                >
                  Modifier adresse
                </button>
                <button
                  disabled={cart.length === 0}
                  onClick={createOrderAndPaymentLink}
                  className={`px-5 py-2 rounded text-white ${
                    cart.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Créer la commande
                </button>
              </div>
            </div>
          )}

          {/* --- PAYMENT --- */}
          {step === "payment" && (
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-semibold">Lien de paiement généré</h3>
              <p className="text-gray-700">
                Montant total : {(getTotalPrice() + 3.5).toFixed(2)} € (Frais de
                livraison inclus)
              </p>
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-red-600 font-semibold underline"
              >
                {paymentLink}
              </a>

              <button
                onClick={sendPaymentLink}
                className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
              >
                Envoyer le lien au client
              </button>
            </div>
          )}

          {/* --- Customization Modal --- */}
          {customizingProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
              <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold">
                    {customizingProduct.name} - Personnalisation
                  </h4>
                  <button
                    onClick={() => setCustomizingProduct(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Taille */}
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Taille</label>
                  <select
                    value={customization.size}
                    onChange={(e) =>
                      setCustomization((prev) => ({
                        ...prev,
                        size: e.target.value as any,
                      }))
                    }
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="small">Petite</option>
                    <option value="medium">Moyenne</option>
                    <option value="large">Grande</option>
                  </select>
                </div>

                {/* Quantité */}
                <div className="mb-4">
                  <label className="block mb-2 font-semibold">Quantité</label>
                  <input
                    type="number"
                    min={1}
                    value={customization.quantity}
                    onChange={(e) =>
                      setCustomization((prev) => ({
                        ...prev,
                        quantity: Math.max(1, Number(e.target.value)),
                      }))
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {/* Garnitures */}
                <div className="mb-4 max-h-48 overflow-y-auto">
                  <label className="block mb-2 font-semibold">
                    Garnitures (+prix)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(toppings || []).map((t: any) => (
                      <label key={t.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={customization.toppings[t.id] || false}
                          onChange={() => toggleTopping(t.id)}
                        />
                        <span>
                          {t.name} (+{t.price.toFixed(2)} €)
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setCustomizingProduct(null)}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmCustomization}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Ajouter au panier
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
