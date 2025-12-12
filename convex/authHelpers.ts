import { MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Require authentication for a mutation.
 * Throws an error if the user is not logged in.
 * @returns The authenticated user's ID
 */
export async function requireAuth(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized: You must be logged in to perform this action");
  }
  return userId;
}
