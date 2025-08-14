/*
  # Fix RLS Infinite Recursion

  1. Drop all existing policies that cause recursion
  2. Recreate simple policies without circular references
  3. Use only auth.uid() and auth.email() functions
  4. Avoid any cross-table references in policies
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Admin can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

DROP POLICY IF EXISTS "Admin can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can read all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

DROP POLICY IF EXISTS "Admin can manage products" ON products;
DROP POLICY IF EXISTS "Anyone can read available products" ON products;

DROP POLICY IF EXISTS "Admin can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can read active categories" ON categories;

DROP POLICY IF EXISTS "Admin can manage toppings" ON toppings;
DROP POLICY IF EXISTS "Anyone can read available toppings" ON toppings;

DROP POLICY IF EXISTS "Admin can read all orders" ON orders;
DROP POLICY IF EXISTS "Admin can update order status" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own pending orders" ON orders;

DROP POLICY IF EXISTS "Admin can read all order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for own orders" ON order_items;
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;

DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;

-- Create simple policies without recursion

-- Users table policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin full access" ON users
  FOR ALL TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Categories table policies
CREATE POLICY "Anyone can read active categories" ON categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage categories" ON categories
  FOR ALL TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Products table policies
CREATE POLICY "Anyone can read available products" ON products
  FOR SELECT TO anon, authenticated
  USING (is_available = true);

CREATE POLICY "Admin can manage products" ON products
  FOR ALL TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Toppings table policies
CREATE POLICY "Anyone can read available toppings" ON toppings
  FOR SELECT TO anon, authenticated
  USING (is_available = true);

CREATE POLICY "Admin can manage toppings" ON toppings
  FOR ALL TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Addresses table policies
CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Orders table policies
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending orders" ON orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage all orders" ON orders
  FOR ALL TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Order items table policies
CREATE POLICY "Users can read own order items" ON order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can create order items for own orders" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admin can manage all order items" ON order_items
  FOR ALL TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Notifications table policies
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage all notifications" ON notifications
  FOR ALL TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');