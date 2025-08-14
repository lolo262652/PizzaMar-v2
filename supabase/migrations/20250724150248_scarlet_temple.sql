/*
  # Assurer que l'utilisateur admin existe

  1. Mise à jour
    - S'assurer que laurent.habib@gmail.com a le rôle admin
    - Créer le profil si nécessaire
*/

-- Fonction pour promouvoir un utilisateur en admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS void AS $$
BEGIN
  -- Mettre à jour le rôle si l'utilisateur existe
  UPDATE users 
  SET role = 'admin', updated_at = now()
  WHERE email = user_email;
  
  -- Si aucune ligne n'a été mise à jour, l'utilisateur n'existe pas encore
  IF NOT FOUND THEN
    -- On ne peut pas créer l'utilisateur ici car il faut d'abord qu'il s'inscrive
    RAISE NOTICE 'Utilisateur % non trouvé. Il doit d''abord s''inscrire.', user_email;
  ELSE
    RAISE NOTICE 'Utilisateur % promu admin avec succès.', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Promouvoir laurent.habib@gmail.com en admin s'il existe
SELECT promote_user_to_admin('laurent.habib@gmail.com');

-- Politique RLS pour permettre à l'admin de tout voir
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.email() = 'laurent.habib@gmail.com' OR 
    auth.uid() = id
  )
  WITH CHECK (
    auth.email() = 'laurent.habib@gmail.com' OR 
    auth.uid() = id
  );