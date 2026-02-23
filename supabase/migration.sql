-- ================================================================
-- Supabase SQL Migration — Plataforma de Consumos
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- ================================================================

-- Create the gastos table
CREATE TABLE IF NOT EXISTS public.gastos (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha       DATE           NOT NULL,
  descripcion TEXT           NOT NULL CHECK (char_length(descripcion) <= 200),
  monto       NUMERIC(10, 2) NOT NULL CHECK (monto > 0),
  mes         TEXT           NOT NULL,
  categoria   TEXT           NOT NULL DEFAULT 'Varios',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Add categoria to existing table (run if the table already exists)
ALTER TABLE public.gastos
  ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'Varios';


-- Index for fast month-based queries
CREATE INDEX IF NOT EXISTS idx_gastos_mes ON public.gastos (mes);

-- Enable Row Level Security (recommended by Supabase)
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write (for a personal app without auth)
-- If you add authentication later, you can restrict this to authenticated users only
CREATE POLICY "Allow all for anon" ON public.gastos
  FOR ALL
  USING (true)
  WITH CHECK (true);
