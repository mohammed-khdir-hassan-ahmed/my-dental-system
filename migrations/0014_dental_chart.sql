-- Migration: Add teeth_data column to appointments_table for dental chart feature
ALTER TABLE "appointments_table" ADD COLUMN IF NOT EXISTS "teeth_data" text DEFAULT NULL;
