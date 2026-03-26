// Formats the error message when required environment variables are missing
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";

export default function tryParseEnv(
  EnvSchema: ZodTypeAny,
  buildEnv: Record<string, string | undefined> = process.env,
) {
  try {
    EnvSchema.parse(buildEnv);
  }
  catch (error) {
    if (error instanceof ZodError) {
      let message = "Missing required values in .env:\n";
      error.issues.forEach((issue) => {
        const key = issue.path.length ? issue.path.map(String).join('.') : '(root)'
        message += `${key}\n`;
      });
      const e = new Error(message);
      e.stack = "";
      throw e;
    }
    else {
      console.error(error);
    }
  }
}