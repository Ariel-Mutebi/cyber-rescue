import { ConvexError } from 'convex/values'
import type { QueryCtx } from '../_generated/server'

export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function getParticipant(ctx: QueryCtx, token: string) {
  const tokenHash = await hashToken(token)
  return await ctx.db
    .query('participants')
    .withIndex('by_token', (q) => q.eq('tokenHash', tokenHash))
    .unique()
}

export async function requireParticipant(ctx: QueryCtx, token: string) {
  const participant = await getParticipant(ctx, token)
  if (participant === null) {
    throw new ConvexError('Your session expired. Pick a handle again.')
  }
  return participant
}
