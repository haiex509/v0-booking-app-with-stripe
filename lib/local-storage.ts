import bcrypt from "bcryptjs"

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ProductionPackage {
  id: string
  name: string
  price: number
  features: string[]
  popular?: boolean
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminAuth {
  codeHash: string
  lastUpdated: string
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  ADMIN_AUTH: "admin_auth",
  PACKAGES: "production_packages",
} as const

// ============================================
// DEFAULT DATA
// ============================================

const DEFAULT_ADMIN_CODE = "ADMIN2025"

const DEFAULT_PACKAGES: ProductionPackage[] = [
  {
    id: "indie",
    name: "Indie",
    price: 399,
    features: ["1 hr studio rental", "20 cinematic edits", "1 look/1 backdrop", "Online gallery"],
    popular: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "feature",
    name: "Feature",
    price: 799,
    popular: true,
    features: [
      "3 hr production",
      "60 final stills",
      "2 looks + set changes",
      "Color-graded gallery",
      "MUA & stylist included",
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "blockbuster",
    name: "Blockbuster",
    price: 1499,
    features: ["Full-day shoot", "120+ hero images", "Unlimited sets", "Behind-the-scenes 4K video", "Same-day teaser"],
    popular: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ============================================
// ADMIN AUTH MANAGEMENT
// ============================================

export const adminAuth = {
  /**
   * Initialize admin auth with default code if not exists
   */
  initialize: (): void => {
    if (typeof window === "undefined") return

    const existing = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH)
    if (!existing) {
      const hash = bcrypt.hashSync(DEFAULT_ADMIN_CODE, 10)
      const authData: AdminAuth = {
        codeHash: hash,
        lastUpdated: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(authData))
    }
  },

  /**
   * Verify admin code
   */
  verify: (code: string): boolean => {
    if (typeof window === "undefined") return false

    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH)
    if (!stored) {
      adminAuth.initialize()
      return false
    }

    const authData: AdminAuth = JSON.parse(stored)
    return bcrypt.compareSync(code, authData.codeHash)
  },

  /**
   * Update admin code
   */
  update: (currentCode: string, newCode: string): { success: boolean; error?: string } => {
    if (typeof window === "undefined") {
      return { success: false, error: "Not available in server context" }
    }

    // Verify current code
    if (!adminAuth.verify(currentCode)) {
      return { success: false, error: "Current code is incorrect" }
    }

    // Validate new code
    if (newCode.length < 6) {
      return { success: false, error: "New code must be at least 6 characters" }
    }

    // Hash and store new code
    const newHash = bcrypt.hashSync(newCode, 10)
    const authData: AdminAuth = {
      codeHash: newHash,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(authData))

    return { success: true }
  },

  /**
   * Get default code (for display only)
   */
  getDefaultCode: (): string => DEFAULT_ADMIN_CODE,
}

// ============================================
// PACKAGE MANAGEMENT
// ============================================

export const packageStorage = {
  /**
   * Get all packages
   */
  getAll: (): ProductionPackage[] => {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(STORAGE_KEYS.PACKAGES)
    if (!stored) {
      // Initialize with defaults
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(DEFAULT_PACKAGES))
      return DEFAULT_PACKAGES
    }
    return JSON.parse(stored)
  },

  /**
   * Get package by ID
   */
  getById: (id: string): ProductionPackage | undefined => {
    const packages = packageStorage.getAll()
    return packages.find((pkg) => pkg.id === id)
  },

  /**
   * Create new package
   */
  create: (pkg: Omit<ProductionPackage, "id" | "createdAt" | "updatedAt">): ProductionPackage => {
    const packages = packageStorage.getAll()
    const newPackage: ProductionPackage = {
      ...pkg,
      id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    packages.push(newPackage)
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages))
    return newPackage
  },

  /**
   * Update existing package
   */
  update: (id: string, updates: Partial<Omit<ProductionPackage, "id" | "createdAt">>): ProductionPackage | null => {
    const packages = packageStorage.getAll()
    const index = packages.findIndex((pkg) => pkg.id === id)
    if (index === -1) return null

    packages[index] = {
      ...packages[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages))
    return packages[index]
  },

  /**
   * Delete package
   */
  delete: (id: string): boolean => {
    const packages = packageStorage.getAll()
    const filtered = packages.filter((pkg) => pkg.id !== id)
    if (filtered.length === packages.length) return false
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(filtered))
    return true
  },

  /**
   * Search packages by name or features
   */
  search: (query: string): ProductionPackage[] => {
    const packages = packageStorage.getAll()
    const lowerQuery = query.toLowerCase()
    return packages.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(lowerQuery) || pkg.features.some((f) => f.toLowerCase().includes(lowerQuery)),
    )
  },

  /**
   * Filter packages by criteria
   */
  filter: (filters: {
    minPrice?: number
    maxPrice?: number
    popular?: boolean
    isActive?: boolean
  }): ProductionPackage[] => {
    let packages = packageStorage.getAll()

    if (filters.minPrice !== undefined) {
      packages = packages.filter((pkg) => pkg.price >= filters.minPrice!)
    }
    if (filters.maxPrice !== undefined) {
      packages = packages.filter((pkg) => pkg.price <= filters.maxPrice!)
    }
    if (filters.popular !== undefined) {
      packages = packages.filter((pkg) => pkg.popular === filters.popular)
    }
    if (filters.isActive !== undefined) {
      packages = packages.filter((pkg) => pkg.isActive === filters.isActive)
    }

    return packages
  },
}

// ============================================
// CONVENIENCE EXPORTS
// ============================================

// Auth exports
export const initializeAdminCode = adminAuth.initialize
export const verifyAdminCode = adminAuth.verify
export const updateAdminCode = adminAuth.update
export const getDefaultCode = adminAuth.getDefaultCode

// Package exports
export const getPackages = packageStorage.getAll
export const getPackageById = packageStorage.getById
export const createPackage = packageStorage.create
export const updatePackage = packageStorage.update
export const deletePackage = packageStorage.delete
export const searchPackages = packageStorage.search
export const filterPackages = packageStorage.filter

// Type exports
export type Package = ProductionPackage
