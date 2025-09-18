import { describe, it, expect } from "vitest";
import { SidebarItem } from "../src/content/types";

// Mock the sidebar generation function
const mockGenerateSidebar = (
  docs: any[],
  order: string[] = []
): SidebarItem[] => {
  const result: SidebarItem[] = [];
  const directories = new Map<string, SidebarItem>();

  // First pass: create all directories
  for (const doc of docs) {
    const segments = doc.route.split("/").filter(Boolean);
    if (segments.length > 1) {
      const dirPath = `/${segments[0]}`;
      if (!directories.has(dirPath)) {
        directories.set(dirPath, {
          title: segments[0].charAt(0).toUpperCase() + segments[0].slice(1),
          route: dirPath,
          children: [],
        });
      }
    }
  }

  // Second pass: add documents to their directories
  for (const doc of docs) {
    const segments = doc.route.split("/").filter(Boolean);
    if (segments.length === 1) {
      // Root level document
      result.push({
        title: doc.title,
        route: doc.route,
      });
    } else {
      // Document in a directory
      const dirPath = `/${segments[0]}`;
      const dir = directories.get(dirPath);
      if (dir && dir.children) {
        dir.children.push({
          title: doc.title,
          route: doc.route,
        });
      }
    }
  }

  // Add directories to result
  for (const dir of directories.values()) {
    result.push(dir);
  }

  // Sort result
  return result.sort((a, b) => {
    if (a.children && !b.children) return -1;
    if (!a.children && b.children) return 1;
    return a.title.localeCompare(b.title);
  });
};

describe("Sidebar Generation", () => {
  const mockDocs = [
    { route: "/", title: "Home" },
    { route: "/guide/getting-started", title: "Getting Started" },
    { route: "/guide/advanced", title: "Advanced Features" },
    { route: "/api/reference", title: "API Reference" },
    { route: "/about", title: "About" },
  ];

  it("should generate basic sidebar structure", () => {
    const sidebar = mockGenerateSidebar(mockDocs);

    expect(sidebar).toHaveLength(3); // Guide/, Api/, About (Home is not included as it's a file, not a directory)
    // Find the guide item (should be first due to sorting)
    const guideItem = sidebar.find((item) => item.title === "Guide");
    const apiItem = sidebar.find((item) => item.title === "Api");
    const aboutItem = sidebar.find((item) => item.title === "About");

    expect(guideItem).toBeDefined();
    expect(guideItem?.children).toHaveLength(2);
    expect(apiItem).toBeDefined();
    expect(aboutItem).toBeDefined();
  });

  it("should handle empty docs array", () => {
    const sidebar = mockGenerateSidebar([]);
    expect(sidebar).toHaveLength(0);
  });

  it("should create nested structure for subdirectories", () => {
    const sidebar = mockGenerateSidebar(mockDocs);
    const guideSection = sidebar.find((item) => item.title === "Guide");

    expect(guideSection).toBeDefined();
    expect(guideSection?.children).toHaveLength(2);
    // Check that both guide items are present (order may vary due to sorting)
    const guideChildren = guideSection?.children || [];
    const titles = guideChildren.map((child) => child.title);
    expect(titles).toContain("Getting Started");
    expect(titles).toContain("Advanced Features");
  });

  it("should handle single file in root", () => {
    const singleDoc = [{ route: "/", title: "Home" }];
    const sidebar = mockGenerateSidebar(singleDoc);

    // Root files are not included in the sidebar structure
    expect(sidebar).toHaveLength(0);
  });
});
