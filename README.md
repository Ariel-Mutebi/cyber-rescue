# Operation: Cyber Rescue
A team-based CTF platform.

## Developer Environment
Run `npx convex dev` to start-up the back-end on the cloud, and `npm run dev` to start up the front-end.

Set up the environment variables as follows:
```
npx convex env set AUTH_GOOGLE_ID client-id
npx convex env set AUTH_GOOGLE_SECRET client-secret
npx convex env set SITE_URL http://localhost:5173
```
# Production
The production back-end also runs on the cloud, and the front end is served by Vercel.
Run the following to set up the environment variables:

```
npx convex env set --prod AUTH_GOOGLE_ID your-real-client-id
npx convex env set --prod AUTH_GOOGLE_SECRET your-real-client-secret
npx convex env set --prod SITE_URL https://cyber-rescue.vercel.app/
```
