import { databases, DATABASE_ID, BOOKINGS_COLLECTION_ID } from "./appwrite"
import { ID, Query } from "appwrite"
import type { Booking } from "@/components/booking-calendar"

export const appwriteStorage = {
  getAll: async (): Promise<Booking[]> => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, BOOKINGS_COLLECTION_ID, [
        Query.orderDesc("$createdAt"),
      ])
      return response.documents.map((doc) => ({
        id: doc.$id,
        date: doc.date,
        time: doc.time,
        customerName: doc.customerName,
        customerEmail: doc.customerEmail,
        serviceName: doc.serviceName,
        price: doc.price,
        status: doc.status || "confirmed",
        createdAt: doc.$createdAt,
        paymentIntentId: doc.paymentIntentId,
      }))
    } catch (error) {
      console.error("[v0] Error fetching bookings:", error)
      return []
    }
  },

  save: async (booking: Omit<Booking, "id">): Promise<Booking | null> => {
    try {
      const response = await databases.createDocument(DATABASE_ID, BOOKINGS_COLLECTION_ID, ID.unique(), {
        date: booking.date,
        time: booking.time,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        serviceName: booking.serviceName,
        price: booking.price,
        status: booking.status || "confirmed",
        paymentIntentId: booking.paymentIntentId || "",
      })
      return {
        id: response.$id,
        date: response.date,
        time: response.time,
        customerName: response.customerName,
        customerEmail: response.customerEmail,
        serviceName: response.serviceName,
        price: response.price,
        status: response.status,
        createdAt: response.$createdAt,
        paymentIntentId: response.paymentIntentId,
      }
    } catch (error) {
      console.error("[v0] Error saving booking:", error)
      return null
    }
  },

  update: async (id: string, updates: Partial<Booking>): Promise<boolean> => {
    try {
      await databases.updateDocument(DATABASE_ID, BOOKINGS_COLLECTION_ID, id, updates)
      return true
    } catch (error) {
      console.error("[v0] Error updating booking:", error)
      return false
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await databases.deleteDocument(DATABASE_ID, BOOKINGS_COLLECTION_ID, id)
      return true
    } catch (error) {
      console.error("[v0] Error deleting booking:", error)
      return false
    }
  },

  getByDate: async (date: string): Promise<Booking[]> => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, BOOKINGS_COLLECTION_ID, [
        Query.equal("date", date),
        Query.notEqual("status", "cancelled"),
      ])
      return response.documents.map((doc) => ({
        id: doc.$id,
        date: doc.date,
        time: doc.time,
        customerName: doc.customerName,
        customerEmail: doc.customerEmail,
        serviceName: doc.serviceName,
        price: doc.price,
        status: doc.status,
        createdAt: doc.$createdAt,
        paymentIntentId: doc.paymentIntentId,
      }))
    } catch (error) {
      console.error("[v0] Error fetching bookings by date:", error)
      return []
    }
  },
}
