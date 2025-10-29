import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export interface ProductionPackage {
  id: string
  name: string
  price: number
  features: string[]
  popular?: boolean
  is_active?: boolean
  created_at: string
  updated_at: string
}

export type Package = ProductionPackage

export const packageStorage = {
  getAll: async (): Promise<ProductionPackage[]> => {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("production_packages")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching packages:", error)
      return []
    }

    return (data || []).map((pkg) => ({
      ...pkg,
      features: pkg.features as string[],
    }))
  },

  getById: async (id: string): Promise<ProductionPackage | null> => {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("production_packages").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] Error fetching package:", error)
      return null
    }

    return data
      ? {
          ...data,
          features: data.features as string[],
        }
      : null
  },

  create: async (
    pkg: Omit<ProductionPackage, "id" | "created_at" | "updated_at">,
  ): Promise<ProductionPackage | null> => {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("production_packages")
      .insert({
        name: pkg.name,
        price: pkg.price,
        features: pkg.features,
        popular: pkg.popular ?? false,
        is_active: pkg.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating package:", error)
      return null
    }

    return data
      ? {
          ...data,
          features: data.features as string[],
        }
      : null
  },

  update: async (
    id: string,
    updates: Partial<Omit<ProductionPackage, "id" | "created_at">>,
  ): Promise<ProductionPackage | null> => {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("production_packages").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating package:", error)
      return null
    }

    return data
      ? {
          ...data,
          features: data.features as string[],
        }
      : null
  },

  delete: async (id: string): Promise<boolean> => {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from("production_packages").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting package:", error)
      return false
    }

    return true
  },

  search: async (query: string): Promise<ProductionPackage[]> => {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("production_packages")
      .select("*")
      .or(`name.ilike.%${query}%,features.cs.{${query}}`)

    if (error) {
      console.error("[v0] Error searching packages:", error)
      return []
    }

    return (data || []).map((pkg) => ({
      ...pkg,
      features: pkg.features as string[],
    }))
  },

  filter: async (filters: {
    minPrice?: number
    maxPrice?: number
    popular?: boolean
    isActive?: boolean
  }): Promise<ProductionPackage[]> => {
    const supabase = getSupabaseBrowserClient()
    let query = supabase.from("production_packages").select("*")

    if (filters.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice)
    }
    if (filters.popular !== undefined) {
      query = query.eq("popular", filters.popular)
    }
    if (filters.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error filtering packages:", error)
      return []
    }

    return (data || []).map((pkg) => ({
      ...pkg,
      features: pkg.features as string[],
    }))
  },
}

// Export convenience functions
export const getPackages = packageStorage.getAll
export const getPackageById = packageStorage.getById
export const createPackage = packageStorage.create
export const updatePackage = packageStorage.update
export const deletePackage = packageStorage.delete
export const searchPackages = packageStorage.search
export const filterPackages = packageStorage.filter
