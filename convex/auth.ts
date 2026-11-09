import { convexAuth } from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'
import Google from '@auth/core/providers/google'
import { ConvexError } from 'convex/values'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Creators: Google has already verified the email
    Google({
      profile(googleProfile) {
        return {
          id: googleProfile.sub,
          name: googleProfile.name,
          email: googleProfile.email,
          image: googleProfile.picture,
          accountType: 'creator' as const,
        }
      },
    }),

    // Managers: username + password, created only by createManager
    Password({
      id: 'manager',
      profile(params) {
        if (params.flow !== 'signIn') {
          throw new ConvexError('Manager accounts are created by event creators')
        }
        return {
          // Password reads the account id from this key, so it holds the username
          email: params.email as string,
          accountType: 'manager' as const,
        }
      },
    }),
  ],
})
