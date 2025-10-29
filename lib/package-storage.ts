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

export type Package = ProductionPackage

const STORAGE_KEY = "production_packages"

// Initialize with default packages if none exist
const defaultPackages: ProductionPackage[] = [
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

export const packageStorage = {
  getAll: (): ProductionPackage[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Initialize with defaults
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPackages))
      return defaultPackages
    }
    return JSON.parse(stored)
  },

  getById: (id: string): ProductionPackage | undefined => {
    const packages = packageStorage.getAll()
    return packages.find((pkg) => pkg.id === id)
  },

  create: (pkg: Omit<ProductionPackage, "id" | "createdAt" | "updatedAt">): ProductionPackage => {
    const packages = packageStorage.getAll()
    const newPackage: ProductionPackage = {
      ...pkg,
      id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    packages.push(newPackage)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packages))
    return newPackage
  },

  update: (id: string, updates: Partial<Omit<ProductionPackage, "id" | "createdAt">>): ProductionPackage | null => {
    const packages = packageStorage.getAll()
    const index = packages.findIndex((pkg) => pkg.id === id)
    if (index === -1) return null

    packages[index] = {
      ...packages[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packages))
    return packages[index]
  },

  delete: (id: string): boolean => {
    const packages = packageStorage.getAll()
    const filtered = packages.filter((pkg) => pkg.id !== id)
    if (filtered.length === packages.length) return false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  },

  search: (query: string): ProductionPackage[] => {
    const packages = packageStorage.getAll()
    const lowerQuery = query.toLowerCase()
    return packages.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(lowerQuery) || pkg.features.some((f) => f.toLowerCase().includes(lowerQuery)),
    )
  },

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

export const getPackages = packageStorage.getAll
export const getPackageById = packageStorage.getById
export const createPackage = packageStorage.create
export const updatePackage = packageStorage.update
export const deletePackage = packageStorage.delete
export const searchPackages = packageStorage.search
export const filterPackages = packageStorage.filter
