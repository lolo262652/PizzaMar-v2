/*
  # Sample Data for Pizza E-Commerce Application

  1. Sample Categories
    - Pizzas, Boissons, Desserts, Entrées

  2. Sample Products
    - Various pizzas with different prices
    - Drinks and desserts

  3. Sample Toppings
    - Common pizza toppings with prices
*/

-- Insert sample categories
INSERT INTO categories (name, description, display_order, image_url) VALUES 
  ('Pizzas', 'Nos délicieuses pizzas artisanales', 1, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg'),
  ('Boissons', 'Sodas, jus et boissons chaudes', 2, 'https://images.pexels.com/photos/544961/pexels-photo-544961.jpeg'),
  ('Desserts', 'Douceurs pour terminer votre repas', 3, 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg'),
  ('Entrées', 'Pour bien commencer votre repas', 4, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg')
ON CONFLICT DO NOTHING;

-- Insert sample pizzas
INSERT INTO products (category_id, name, description, base_price, image_url, is_pizza) 
SELECT 
  c.id,
  p.name,
  p.description,
  p.base_price,
  p.image_url,
  p.is_pizza
FROM categories c
CROSS JOIN (VALUES
  ('Pizza Margherita', 'Tomate, mozzarella, basilic frais', 12.90, 'https://images.pexels.com/photos/2762942/pexels-photo-2762942.jpeg', true),
  ('Pizza Pepperoni', 'Tomate, mozzarella, pepperoni épicé', 14.90, 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg', true),
  ('Pizza Quattro Stagioni', 'Tomate, mozzarella, champignons, jambon, artichauts, olives', 16.90, 'https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg', true),
  ('Pizza Végétarienne', 'Tomate, mozzarella, poivrons, courgettes, aubergines, tomates cerises', 15.90, 'https://images.pexels.com/photos/1082343/pexels-photo-1082343.jpeg', true),
  ('Pizza Quatre Fromages', 'Mozzarella, gorgonzola, parmesan, chèvre', 17.90, 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg', true),
  ('Pizza Calzone', 'Pizza fermée garnie de jambon, champignons et mozzarella', 15.90, 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg', true)
) AS p(name, description, base_price, image_url, is_pizza)
WHERE c.name = 'Pizzas'
ON CONFLICT DO NOTHING;

-- Insert sample drinks
INSERT INTO products (category_id, name, description, base_price, image_url, is_pizza)
SELECT 
  c.id,
  p.name,
  p.description,
  p.base_price,
  p.image_url,
  p.is_pizza
FROM categories c
CROSS JOIN (VALUES
  ('Coca-Cola 33cl', 'Boisson gazeuse classique', 2.50, 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg', false),
  ('Sprite 33cl', 'Boisson gazeuse au citron', 2.50, 'https://images.pexels.com/photos/544961/pexels-photo-544961.jpeg', false),
  ('Jus d''Orange 25cl', 'Jus d''orange frais pressé', 3.50, 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg', false),
  ('Eau Plate 50cl', 'Eau plate en bouteille', 2.00, 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg', false),
  ('Bière Blonde 33cl', 'Bière blonde artisanale', 4.50, 'https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg', false)
) AS p(name, description, base_price, image_url, is_pizza)
WHERE c.name = 'Boissons'
ON CONFLICT DO NOTHING;

-- Insert sample desserts
INSERT INTO products (category_id, name, description, base_price, image_url, is_pizza)
SELECT 
  c.id,
  p.name,
  p.description,
  p.base_price,
  p.image_url,
  p.is_pizza
FROM categories c
CROSS JOIN (VALUES
  ('Tiramisu', 'Tiramisu traditionnel fait maison', 6.90, 'https://images.pexels.com/photos/6802983/pexels-photo-6802983.jpeg', false),
  ('Panna Cotta', 'Panna cotta aux fruits rouges', 5.90, 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg', false),
  ('Fondant au Chocolat', 'Fondant chaud au chocolat noir', 7.50, 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg', false),
  ('Gelato Vanille', 'Glace italienne à la vanille', 4.90, 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg', false)
) AS p(name, description, base_price, image_url, is_pizza)
WHERE c.name = 'Desserts'
ON CONFLICT DO NOTHING;

-- Insert sample starters
INSERT INTO products (category_id, name, description, base_price, image_url, is_pizza)
SELECT 
  c.id,
  p.name,
  p.description,
  p.base_price,
  p.image_url,
  p.is_pizza
FROM categories c
CROSS JOIN (VALUES
  ('Bruschetta', 'Pain grillé à l''ail, tomates et basilic', 7.90, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', false),
  ('Antipasti Mixtes', 'Sélection de charcuteries et fromages italiens', 12.90, 'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg', false),
  ('Salade Caprese', 'Tomates, mozzarella, basilic, huile d''olive', 8.90, 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg', false),
  ('Arancini', 'Boulettes de riz farcies au fromage', 9.90, 'https://images.pexels.com/photos/4197693/pexels-photo-4197693.jpeg', false)
) AS p(name, description, base_price, image_url, is_pizza)
WHERE c.name = 'Entrées'
ON CONFLICT DO NOTHING;

-- Insert sample toppings
INSERT INTO toppings (name, price) VALUES 
  ('Pepperoni', 2.50),
  ('Champignons', 2.00),
  ('Poivrons', 2.00),
  ('Olives noires', 2.00),
  ('Olives vertes', 2.00),
  ('Fromage extra', 3.00),
  ('Jambon', 3.50),
  ('Anchois', 3.00),
  ('Ananas', 2.50),
  ('Tomates cerises', 2.00),
  ('Roquette', 2.50),
  ('Gorgonzola', 3.50),
  ('Chèvre', 3.50),
  ('Parmesan', 3.00),
  ('Basilic frais', 1.50),
  ('Origan', 1.00),
  ('Piment', 1.00),
  ('Câpres', 2.50),
  ('Artichauts', 3.00),
  ('Aubergines', 2.50)
ON CONFLICT DO NOTHING;