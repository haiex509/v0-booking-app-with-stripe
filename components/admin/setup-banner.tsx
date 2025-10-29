"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Copy, Check, ExternalLink } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const FIX_RLS_SCRIPT = `-- Fix infinite recursion in user_roles RLS policies
-- Run this script in Supabase SQL Editor to fix the issue

-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins have full access" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Create simple, non-recursive policies
-- Policy 1: Allow authenticated users to read their own role
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Allow authenticated users to read all roles (needed for admin features)
CREATE POLICY "Authenticated users can read all roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy 3: Only allow INSERT/UPDATE/DELETE via service role
CREATE POLICY "Service role can manage roles"
  ON public.user_roles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;`

const CREATE_TABLE_SCRIPT = `-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer')),
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON public.user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (no recursion)
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read all roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage roles"
  ON public.user_roles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`

type SetupStatus = "loading" | "missing" | "recursion_error" | "ok"

export function SetupBanner() {
  const [status, setStatus] = useState<SetupStatus>("loading")
  const [copied, setCopied] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    checkTableStatus()
  }, [])

  const checkTableStatus = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("user_roles").select("id").limit(1)

      if (error) {
        if (error.message.includes("infinite recursion") || error.code === "42P17") {
          setStatus("recursion_error")
        } else if (error.message.includes("user_roles") || error.code === "PGRST205") {
          setStatus("missing")
        } else {
          setStatus("ok")
        }
      } else {
        setStatus("ok")
      }
    } catch (error) {
      console.error("Error checking table:", error)
      setStatus("missing")
    }
  }

  const copyToClipboard = async () => {
    const script = status === "recursion_error" ? FIX_RLS_SCRIPT : CREATE_TABLE_SCRIPT
    try {
      await navigator.clipboard.writeText(script)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const openSupabaseDashboard = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const projectRef = supabaseUrl.split("//")[1]?.split(".")[0]
      window.open(`https://supabase.com/dashboard/project/${projectRef}/editor`, "_blank")
    }
  }

  if (status === "loading" || status === "ok" || dismissed) {
    return null
  }

  const isRecursionError = status === "recursion_error"

  return (
    <Alert className="bg-amber-950/20 border-amber-900/50 mb-6">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-500 font-semibold">
        {isRecursionError ? "Fix Required: RLS Policy Issue" : "Setup Required: User Roles Table"}
      </AlertTitle>
      <AlertDescription className="text-amber-200/80 mt-2 space-y-3">
        <p>
          {isRecursionError ? (
            <>
              The <code className="bg-amber-950/50 px-1.5 py-0.5 rounded text-xs">user_roles</code> table has infinite
              recursion in its RLS policies. Run the fix script below to resolve this.
            </>
          ) : (
            <>
              The <code className="bg-amber-950/50 px-1.5 py-0.5 rounded text-xs">user_roles</code> table hasn't been
              created yet. Until then, all authenticated users have admin access.
            </>
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
            className="bg-amber-950/30 border-amber-800 text-amber-200 hover:bg-amber-900/40"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1.5" />
                {isRecursionError ? "Copy Fix Script" : "Copy SQL Script"}
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={openSupabaseDashboard}
            className="bg-amber-950/30 border-amber-800 text-amber-200 hover:bg-amber-900/40"
          >
            <ExternalLink className="w-3 h-3 mr-1.5" />
            Open SQL Editor
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
          >
            Dismiss
          </Button>
        </div>

        <details className="text-xs text-amber-300/70 mt-2">
          <summary className="cursor-pointer hover:text-amber-300">
            {isRecursionError ? "Show fix instructions" : "Show setup instructions"}
          </summary>
          <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
            <li>Click "{isRecursionError ? "Copy Fix Script" : "Copy SQL Script"}" above</li>
            <li>Click "Open SQL Editor" to go to your Supabase dashboard</li>
            <li>Paste the SQL script in the editor</li>
            <li>Click "Run" to {isRecursionError ? "fix the policies" : "create the table"}</li>
            <li>Refresh this page</li>
          </ol>
        </details>
      </AlertDescription>
    </Alert>
  )
}
