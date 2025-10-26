"use server"

import { Client, Account, Databases } from "node-appwrite"
import { cookies } from "next/headers"

export async function createSessionClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT

  console.log("[v0] Appwrite config check:", {
    hasEndpoint: !!endpoint,
    hasProject: !!project,
    endpoint: endpoint,
    project: project,
  })

  if (!endpoint || !project) {
    throw new Error(
      `Missing Appwrite configuration. Please set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT environment variables.`,
    )
  }

  const client = new Client().setEndpoint(endpoint).setProject(project)

  const session = (await cookies()).get("appwrite-session")
  if (!session || !session.value) {
    throw new Error("No session")
  }

  client.setSession(session.value)

  return {
    get account() {
      return new Account(client)
    },
    get databases() {
      return new Databases(client)
    },
  }
}

export async function createAdminClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT
  const key = process.env.NEXT_APPWRITE_KEY

  console.log("[v0] Appwrite admin config check:", {
    hasEndpoint: !!endpoint,
    hasProject: !!project,
    hasKey: !!key,
    endpoint: endpoint,
    project: project,
  })

  if (!endpoint || !project || !key) {
    throw new Error(
      `Missing Appwrite configuration. Please set NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, and NEXT_APPWRITE_KEY environment variables.`,
    )
  }

  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key)

  return {
    get account() {
      return new Account(client)
    },
    get databases() {
      return new Databases(client)
    },
  }
}
