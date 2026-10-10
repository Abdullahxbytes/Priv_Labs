import "dotenv/config";
import { analyzePrivacyPolicy } from "../src/privacy-engine/policy-extraction.js";

const samplePolicy =
  "We collect location information to provide personalized services. " +
  "We may share device identifiers with advertising partners. " +
  "Users may request deletion of their data. Data is encrypted in transit.";

async function main(): Promise<void> {
  try {
    const result = await analyzePrivacyPolicy(samplePolicy);
    const collected = result.dataCollected.some((item) => item.type === "location" && item.status === "found");
    const sharedItem = result.dataShared.find((item) => item.type === "device_identifiers" && item.status === "found");
    const shared = Boolean(sharedItem);
    const advertising = Boolean(
      result.thirdParties.some((item) => item.toLowerCase().includes("advertising")) ||
      sharedItem?.recipients.some((item) => item.toLowerCase().includes("advertising")) ||
      sharedItem?.evidence?.toLowerCase().includes("advertising"),
    );
    const deletion = result.deletion.status === "found";
    const encryption = result.security.some((item) => item.type === "encryption" && item.status === "found");

    if (!collected || !shared || !advertising || !deletion || !encryption) {
      throw new Error("Expected sample categories were not present in validated extraction.");
    }
    console.log("Privacy-policy extraction smoke test passed.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Extraction smoke test failed.");
    process.exitCode = 1;
  }
}

void main();
