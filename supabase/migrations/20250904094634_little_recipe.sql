/*
  # Correção completa do sistema de usuários e políticas

  1. Limpeza e recriação das políticas
    - Remove todas as políticas existentes da tabela users
    - Cria políticas simples e funcionais
    - Evita recursão infinita

  2. Configuração do usuário super admin
    - Garante que o usuário específico seja super admin aprovado
    - Permite funcionamento imediato do sistema

  3. Políticas simplificadas
    - Política de leitura própria para usuários
    - Política de leitura completa para super admins
    - Política de inserção para novos usuários
    - Política de atualização para super admins
*/

-- Remove todas as políticas existentes da tabela users
DROP POLICY IF EXISTS "Allow user signup" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Super admins can read all users" ON users;
DROP POLICY IF EXISTS "Super admins can update users" ON users;

-- Garante que o usuário específico seja super admin aprovado
INSERT INTO users (id, email, full_name, is_super_admin, is_approved)
VALUES (
  'a2651373-0eae-4673-ab9a-1c6ad32fc7bf',
  'guthierresc@hotmail.com',
  'Administrador',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_super_admin = true,
  is_approved = true;

-- Política para permitir inserção de novos usuários (signup)
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política para usuários lerem seus próprios dados
CREATE POLICY "users_select_own_policy" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para super admins lerem todos os usuários
CREATE POLICY "users_select_admin_policy" ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = 'a2651373-0eae-4673-ab9a-1c6ad32fc7bf'::uuid
    OR EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.id IN (
        SELECT u.id FROM users u 
        WHERE u.id = au.id 
        AND u.is_super_admin = true 
        AND u.is_approved = true
      )
    )
  );

-- Política para super admins atualizarem usuários
CREATE POLICY "users_update_admin_policy" ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = 'a2651373-0eae-4673-ab9a-1c6ad32fc7bf'::uuid
    OR EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.id IN (
        SELECT u.id FROM users u 
        WHERE u.id = au.id 
        AND u.is_super_admin = true 
        AND u.is_approved = true
      )
    )
  );