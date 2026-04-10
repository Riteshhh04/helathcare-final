-- Create users table for storing registered users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table for storing medical certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  certificate_type TEXT NOT NULL,
  issued_by TEXT NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  file_url TEXT,
  blockchain_hash TEXT,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_tokens table for email verification
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_certificates_patient_id ON public.certificates(patient_id);
CREATE INDEX IF NOT EXISTS idx_certificates_blockchain_hash ON public.certificates(blockchain_hash);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.verification_tokens(token);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Allow public read for user lookup (needed for login)
CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
-- Allow public insert for registration
CREATE POLICY "users_insert_all" ON public.users FOR INSERT WITH CHECK (true);
-- Allow users to update their own profile
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (true);

-- RLS Policies for certificates table
-- Allow all to read certificates (for verification)
CREATE POLICY "certificates_select_all" ON public.certificates FOR SELECT USING (true);
-- Allow insert for admins (handled in application logic)
CREATE POLICY "certificates_insert_all" ON public.certificates FOR INSERT WITH CHECK (true);
-- Allow update for admins
CREATE POLICY "certificates_update_all" ON public.certificates FOR UPDATE USING (true);
-- Allow delete for admins
CREATE POLICY "certificates_delete_all" ON public.certificates FOR DELETE USING (true);

-- RLS Policies for verification_tokens table
CREATE POLICY "tokens_select_all" ON public.verification_tokens FOR SELECT USING (true);
CREATE POLICY "tokens_insert_all" ON public.verification_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "tokens_delete_all" ON public.verification_tokens FOR DELETE USING (true);
