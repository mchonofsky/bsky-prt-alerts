import { env } from "node:process";
import { z } from "zod";
import type { AtpAgentLoginOpts } from "@atproto/api";

const envSchema = z.object({
  BSKY_HANDLE: z.string().nonempty(),
  BSKY_PASSWORD: z.string().nonempty(),
  BSKY_SERVICE: z.string().nonempty().default("https://bsky.social"),
  METRA_USERNAME: z.string().nonempty(),
  METRA_PASSWORD: z.string().nonempty()
});

const parsed = envSchema.parse(env);
export const bskyAccount: AtpAgentLoginOpts = {
  identifier: parsed.BSKY_HANDLE,
  password: parsed.BSKY_PASSWORD,
};

export const metraAccount = {
    username: parsed.METRA_USERNAME,
    password: parsed.METRA_PASSWORD
}

export const firebaseServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

export const bskyService = parsed.BSKY_SERVICE;

