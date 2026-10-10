import "dotenv/config";
import { callGroq } from "../src/privacy-engine/groq-client.js";

async function main(): Promise<void> {
  try {
    const response = await callGroq(
      "Return exactly: PrivacyLens Groq connection successful",
    );
    console.log(response);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Groq smoke test failed.");
    process.exitCode = 1;
  }
}

void main();
