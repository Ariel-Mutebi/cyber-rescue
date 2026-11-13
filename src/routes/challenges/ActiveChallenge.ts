import { api } from '../../../convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'

type Current = FunctionReturnType<typeof api.challenges.getCurrent>
export type ActiveChallenge = Extract<Current, { status: 'active' }>['challenge']
