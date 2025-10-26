import bcrypt from "bcryptjs"

const STORAGE_KEY = "admin_code_hash"
const DEFAULT_CODE = "ADMIN2025"

/**
 * Initialize the admin code hash in localStorage if it doesn't exist
 */
export function initializeAdminCode(): void {
  if (typeof window === "undefined") return

  const existingHash = localStorage.getItem(STORAGE_KEY)
  if (!existingHash) {
    // Hash the default code and store it
    const hash = bcrypt.hashSync(DEFAULT_CODE, 10)
    localStorage.setItem(STORAGE_KEY, hash)
  }
}

/**
 * Verify if the provided code matches the stored hash
 */
export function verifyAdminCode(code: string): boolean {
  if (typeof window === "undefined") return false

  const storedHash = localStorage.getItem(STORAGE_KEY)
  if (!storedHash) {
    initializeAdminCode()
    return false
  }

  return bcrypt.compareSync(code, storedHash)
}

/**
 * Update the admin code with a new one
 */
export function updateAdminCode(currentCode: string, newCode: string): { success: boolean; error?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "Not available in server context" }
  }

  // Verify current code first
  if (!verifyAdminCode(currentCode)) {
    return { success: false, error: "Current code is incorrect" }
  }

  // Validate new code
  if (newCode.length < 6) {
    return { success: false, error: "New code must be at least 6 characters" }
  }

  // Hash and store new code
  const newHash = bcrypt.hashSync(newCode, 10)
  localStorage.setItem(STORAGE_KEY, newHash)

  return { success: true }
}

/**
 * Get the default admin code (for display purposes only)
 */
export function getDefaultCode(): string {
  return DEFAULT_CODE
}
