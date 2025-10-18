import type { Booking } from "@/components/booking-calendar"

export const bookingStorage = {
  getAll: (): Booking[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("bookings")
    return stored ? JSON.parse(stored) : []
  },

  save: (booking: Booking): void => {
    if (typeof window === "undefined") return
    const bookings = bookingStorage.getAll()
    bookings.push(booking)
    localStorage.setItem("bookings", JSON.stringify(bookings))
  },

  update: (id: string, updates: Partial<Booking>): void => {
    if (typeof window === "undefined") return
    const bookings = bookingStorage.getAll()
    const index = bookings.findIndex((b) => b.id === id)
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...updates }
      localStorage.setItem("bookings", JSON.stringify(bookings))
    }
  },

  delete: (id: string): void => {
    if (typeof window === "undefined") return
    const bookings = bookingStorage.getAll().filter((b) => b.id !== id)
    localStorage.setItem("bookings", JSON.stringify(bookings))
  },

  getByDate: (date: string): Booking[] => {
    return bookingStorage.getAll().filter((b) => b.date === date)
  },
}
