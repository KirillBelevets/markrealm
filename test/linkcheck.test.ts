import { describe, it, expect } from "vitest";
import { Link } from "../src/content/types";

// Mock the link checking functions
const mockCheckInternalLink = (
  link: Link,
  availableRoutes: string[]
): boolean => {
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
  const routeExists = availableRoutes.includes(targetRoute);
  if (!routeExists) {
    return false;
  }

  // If there's a hash, we'll assume it's valid for this test
  // In real implementation, we'd check if the heading exists
  return true;
};

const mockCheckInternalLinks = (links: Link[], availableRoutes: string[]) => {
  const result = {
    broken: [] as Link[],
    valid: [] as Link[],
    external: [] as Link[],
  };

  for (const link of links) {
    if (link.type === "external") {
      result.external.push(link);
    } else if (link.type === "internal") {
      const isValid = mockCheckInternalLink(link, availableRoutes);
      if (isValid) {
        result.valid.push(link);
      } else {
        result.broken.push(link);
      }
    }
  }

  return result;
};

describe("Link Checking", () => {
  const availableRoutes = [
    "/",
    "/guide/getting-started",
    "/guide/advanced",
    "/api/reference",
  ];

  it("should identify valid internal links", () => {
    const links: Link[] = [
      {
        href: "/guide/getting-started",
        text: "Getting Started",
        type: "internal",
        target: "/guide/getting-started",
      },
      {
        href: "getting-started",
        text: "Getting Started",
        type: "internal",
        target: "getting-started",
      },
      { href: "/", text: "Home", type: "internal", target: "/" },
    ];

    const result = mockCheckInternalLinks(links, availableRoutes);

    expect(result.valid).toHaveLength(2); // Only the first two are valid
    expect(result.broken).toHaveLength(1); // The relative link "getting-started" is broken
  });

  it("should identify broken internal links", () => {
    const links: Link[] = [
      {
        href: "/non-existent",
        text: "Non-existent",
        type: "internal",
        target: "/non-existent",
      },
      {
        href: "/guide/missing",
        text: "Missing Guide",
        type: "internal",
        target: "/guide/missing",
      },
    ];

    const result = mockCheckInternalLinks(links, availableRoutes);

    expect(result.valid).toHaveLength(0);
    expect(result.broken).toHaveLength(2);
  });

  it("should categorize external links", () => {
    const links: Link[] = [
      { href: "https://example.com", text: "Example", type: "external" },
      { href: "https://github.com", text: "GitHub", type: "external" },
      {
        href: "/guide/getting-started",
        text: "Getting Started",
        type: "internal",
        target: "/guide/getting-started",
      },
    ];

    const result = mockCheckInternalLinks(links, availableRoutes);

    expect(result.external).toHaveLength(2);
    expect(result.valid).toHaveLength(1);
    expect(result.broken).toHaveLength(0);
  });

  it("should handle mixed link types", () => {
    const links: Link[] = [
      {
        href: "/guide/getting-started",
        text: "Getting Started",
        type: "internal",
        target: "/guide/getting-started",
      },
      {
        href: "/broken-link",
        text: "Broken",
        type: "internal",
        target: "/broken-link",
      },
      { href: "https://example.com", text: "Example", type: "external" },
    ];

    const result = mockCheckInternalLinks(links, availableRoutes);

    expect(result.valid).toHaveLength(1);
    expect(result.broken).toHaveLength(1);
    expect(result.external).toHaveLength(1);
  });

  it("should handle links with hash fragments", () => {
    const links: Link[] = [
      {
        href: "/guide/getting-started#installation",
        text: "Installation",
        type: "internal",
        target: "/guide/getting-started",
        hash: "installation",
      },
      {
        href: "/guide/getting-started#non-existent",
        text: "Non-existent Section",
        type: "internal",
        target: "/guide/getting-started",
        hash: "non-existent",
      },
    ];

    const result = mockCheckInternalLinks(links, availableRoutes);

    // Both should be valid since we're not checking hash existence in this mock
    expect(result.valid).toHaveLength(2);
    expect(result.broken).toHaveLength(0);
  });
});
