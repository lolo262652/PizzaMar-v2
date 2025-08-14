/*
  # Fix infinite recursion in users table policies

  1. Problem
    - The users table has a self-referencing foreign key constraint
    - This causes infinite recursion in RLS policies
    - Affects notifications and products loading

  2. Solution
    - Remove the problematic foreign key constraint
    - Simplify RLS policies to avoid recursion
    - Keep auth.users as the source of truth for authentication
*/

-- Remove the problematic self-referencing foreign key
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create simplified policies without recursion
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com');

CREATE POLICY "Admin can manage all users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Ensure the users table structure is correct without self-reference
-- The id should reference auth.users(id) but we'll handle this at the application level
-- instead of with a foreign key constraint to avoid recursion

-- Update other policies that might reference users table incorrectly
DROP POLICY IF EXISTS "Admins can read all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

CREATE POLICY "Admin can read all notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com');

CREATE POLICY "Admin can manage all notifications"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Fix products policies
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Admin can manage products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Fix categories policies
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Admin can manage categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Fix toppings policies
DROP POLICY IF EXISTS "Admins can manage toppings" ON public.toppings;

CREATE POLICY "Admin can manage toppings"
  ON public.toppings
  FOR ALL
  TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Fix orders policies
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update order status" ON public.orders;

CREATE POLICY "Admin can read all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com');

CREATE POLICY "Admin can update order status"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com')
  WITH CHECK (auth.email() = 'laurent.habib@gmail.com');

-- Fix order_items policies
DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;

CREATE POLICY "Admin can read all order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (auth.email() = 'laurent.habib@gmail.com');