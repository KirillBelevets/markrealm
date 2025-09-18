import fetch from "node-fetch";
import { ContentIndex, Link } from "./types";

export interface LinkCheckResult {
  broken: Link[];
  valid: Link[];
  external: Link[];
}

export async function checkInternalLinks(
  index: ContentIndex
): Promise<LinkCheckResult> {
  const result: LinkCheckResult = {
    broken: [],
    valid: [],
    external: [],
  };

  for (const doc of index.byRoute.values()) {
    for (const link of doc.links) {
      if (link.type === "external") {
        result.external.push(link);
        continue;
      }

      if (link.type === "internal") {
        const isValid = await checkInternalLink(link, index);
        if (isValid) {
          result.valid.push(link);
        } else {
          result.broken.push(link);
        }
      }
    }
  }

  return result;
}

async function checkInternalLink(
  link: Link,
  index: ContentIndex
): Promise<boolean> {
  if (!link.target) {
    return false;
  }

  // Handle different link formats
  let targetRoute = link.target;

  // Add leading slash if missing
  if (!targetRoute.startsWith("/")) {
    targetRoute = `/${targetRoute}`;
  }

  // Remove trailing slash for consistency
  if (targetRoute.endsWith("/") && targetRoute !== "/") {
    targetRoute = targetRoute.slice(0, -1);
  }

  // Check if route exists
  const targetDoc = index.byRoute.get(targetRoute);
  if (!targetDoc) {
    return false;
  }

  // If there's a hash, check if the heading exists
  if (link.hash) {
    const headingExists = targetDoc.headings.some(
      (heading) => heading.id === link.hash
    );
    if (!headingExists) {
      return false;
    }
  }

  return true;
}

export async function checkExternalLinks(
  urls: string[],
  timeoutMs: number = 5000
): Promise<{ valid: string[]; broken: string[] }> {
  const valid: string[] = [];
  const broken: string[] = [];

  // Process URLs in batches to avoid overwhelming servers
  const batchSize = 10;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const promises = batch.map((url) =>
      checkSingleExternalLink(url, timeoutMs)
    );
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      const url = batch[index];
      if (result.status === "fulfilled" && result.value) {
        valid.push(url);
      } else {
        broken.push(url);
      }
    });
  }

  return { valid, broken };
}

async function checkSingleExternalLink(
  url: string,
  timeoutMs: number
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "markrealm-link-checker/1.0.0",
      },
    });

    clearTimeout(timeoutId);

    // Consider 2xx and 3xx status codes as valid
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    // If HEAD fails, try GET as fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "markrealm-link-checker/1.0.0",
        },
      });

      clearTimeout(timeoutId);

      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }
}

export function printLinkCheckSummary(result: LinkCheckResult): void {
  console.log("\n📊 Link Check Summary");
  console.log("====================");
  console.log(`✅ Valid internal links: ${result.valid.length}`);
  console.log(`❌ Broken internal links: ${result.broken.length}`);
  console.log(`🔗 External links: ${result.external.length}`);

  if (result.broken.length > 0) {
    console.log("\n❌ Broken Links:");
    result.broken.forEach((link) => {
      console.log(`  • ${link.href} (${link.text})`);
    });
  }
}
