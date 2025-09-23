import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from "bcrypt"
import crypto from "crypto"
import { createSession } from "./db"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function hashPassword(plain: string): Promise<string> {
  const rounds = 10
  return await bcrypt.hash(plain, rounds)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash)
  } catch {
    return false
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function createUserSession(userId: number, ttlHours = 24 * 30) {
  const token = generateSessionToken()
  const ttlMs = ttlHours * 60 * 60 * 1000
  return createSession(userId, token, ttlMs)
}
