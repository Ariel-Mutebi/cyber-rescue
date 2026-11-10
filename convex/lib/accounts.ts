import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

// Deletes a user along with the Convex Auth rows holding their credentials and sessions
export async function deleteUserAndAuth(ctx: MutationCtx, userId: Id<'users'>) {
  const accounts = await ctx.db
    .query('authAccounts')
    .withIndex('userIdAndProvider', (q) => q.eq('userId', userId))
    .collect()
  for (const account of accounts) await ctx.db.delete(account._id)

  const sessions = await ctx.db
    .query('authSessions')
    .withIndex('userId', (q) => q.eq('userId', userId))
    .collect()
  for (const session of sessions) {
    const tokens = await ctx.db
      .query('authRefreshTokens')
      .withIndex('sessionId', (q) => q.eq('sessionId', session._id))
      .collect()
    for (const token of tokens) await ctx.db.delete(token._id)
    await ctx.db.delete(session._id)
  }

  await ctx.db.delete(userId)
}
