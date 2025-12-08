-- Create test company first
INSERT INTO public.companies (id, legal_name, trade_name, email, phone, province, city)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Arkelium Test Company',
  'Arkelium Test',
  'admin@arkelium.com',
  '(555) 123-4567',
  'Ontario',
  'Toronto'
) ON CONFLICT (id) DO NOTHING;

-- Create test admin user in auth.users using Supabase's built-in function
-- Note: This creates a user with email: admin@arkelium.com and password: Admin123!
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '00000000-0000-0000-0000-000000000000',
  'admin@arkelium.com',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "User"}',
  now(),
  now(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create profile for the admin user
INSERT INTO public.profiles (id, company_id, first_name, last_name, email, phone)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Admin',
  'User',
  'admin@arkelium.com',
  '(555) 123-4567'
) ON CONFLICT (id) DO NOTHING;

-- Create admin role for the user
INSERT INTO public.user_roles (user_id, company_id, role)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'admin'
) ON CONFLICT DO NOTHING;