/*
  # Fonctions utilitaires pour l'administration

  1. Fonction pour créer un utilisateur admin
  2. Fonction pour obtenir des statistiques
  3. Fonction pour nettoyer les données de test
*/

-- Fonction pour promouvoir un utilisateur en admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET role = 'admin', updated_at = now()
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur avec email % non trouvé', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques du dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json AS $$
DECLARE
  total_orders integer;
  total_revenue decimal;
  total_customers integer;
  orders_today integer;
  result json;
BEGIN
  -- Compter le total des commandes
  SELECT COUNT(*) INTO total_orders FROM orders;
  
  -- Calculer le chiffre d'affaires total
  SELECT COALESCE(SUM(total_amount), 0) INTO total_revenue FROM orders WHERE payment_status = 'paid';
  
  -- Compter le total des clients
  SELECT COUNT(*) INTO total_customers FROM users WHERE role = 'customer';
  
  -- Compter les commandes d'aujourd'hui
  SELECT COUNT(*) INTO orders_today 
  FROM orders 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Construire le résultat JSON
  result := json_build_object(
    'total_orders', total_orders,
    'total_revenue', total_revenue,
    'total_customers', total_customers,
    'orders_today', orders_today
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les commandes de test
CREATE OR REPLACE FUNCTION cleanup_test_orders()
RETURNS void AS $$
BEGIN
  -- Supprimer les items des commandes de test
  DELETE FROM order_items 
  WHERE order_id IN (
    SELECT id FROM orders 
    WHERE notes LIKE '%test%' OR total_amount < 5
  );
  
  -- Supprimer les commandes de test
  DELETE FROM orders 
  WHERE notes LIKE '%test%' OR total_amount < 5;
  
  -- Supprimer les notifications liées aux commandes supprimées
  DELETE FROM notifications 
  WHERE order_id IS NOT NULL 
  AND order_id NOT IN (SELECT id FROM orders);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une commande d'exemple
CREATE OR REPLACE FUNCTION create_sample_order(user_id_param uuid, address_id_param uuid)
RETURNS uuid AS $$
DECLARE
  order_id uuid;
  pizza_id uuid;
  boisson_id uuid;
BEGIN
  -- Créer la commande
  INSERT INTO orders (user_id, address_id, total_amount, status, payment_status, notes)
  VALUES (user_id_param, address_id_param, 17.40, 'confirmed', 'paid', 'Commande d''exemple')
  RETURNING id INTO order_id;
  
  -- Récupérer une pizza et une boisson
  SELECT id INTO pizza_id FROM products WHERE is_pizza = true LIMIT 1;
  SELECT id INTO boisson_id FROM products WHERE is_pizza = false AND name LIKE '%Coca%' LIMIT 1;
  
  -- Ajouter les items
  INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, selected_toppings, size, crust)
  VALUES 
    (order_id, pizza_id, 1, 12.50, 12.50, ARRAY['Pepperoni', 'Champignons'], 'medium', 'thin'),
    (order_id, boisson_id, 2, 2.50, 5.00, ARRAY[]::text[], null, null);
  
  -- Créer une notification
  INSERT INTO notifications (user_id, order_id, type, title, message)
  VALUES (user_id_param, order_id, 'order_confirmed', 'Commande confirmée', 'Votre commande a été confirmée et est en cours de préparation.');
  
  RETURN order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour les statistiques des produits
CREATE OR REPLACE VIEW product_stats AS
SELECT 
  p.id,
  p.name,
  p.base_price,
  c.name as category_name,
  COUNT(oi.id) as total_orders,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.total_price) as total_revenue
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
GROUP BY p.id, p.name, p.base_price, c.name
ORDER BY total_revenue DESC NULLS LAST;

-- Vue pour les commandes avec détails
CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
  o.*,
  u.full_name as customer_name,
  u.email as customer_email,
  u.phone as customer_phone,
  a.title as address_title,
  a.street as address_street,
  a.city as address_city,
  a.postal_code as address_postal_code,
  COUNT(oi.id) as items_count,
  STRING_AGG(p.name, ', ') as products_list
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN addresses a ON o.address_id = a.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY o.id, u.full_name, u.email, u.phone, a.title, a.street, a.city, a.postal_code
ORDER BY o.created_at DESC;