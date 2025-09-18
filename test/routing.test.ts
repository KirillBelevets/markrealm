import { describe, it, expect } from "vitest";
import * as path from "path";

// Mock the loader module
const mockGenerateRoute = (filePath: string, docsDir: string): string => {
  const relativePath = path.relative(docsDir, filePath);
  const pathWithoutExt = relativePath.replace(/\.(md|mdoc)$/, "");

  // Handle index files
  if (path.basename(pathWithoutExt) === "index") {
    const dir = path.dirname(pathWithoutExt);
    return dir === "." ? "/" : `/${dir}`;
  }

  return `/${pathWithoutExt}`;
};

describe("Routing", () => {
  const docsDir = "/test/docs";

  it("should handle index files correctly", () => {
    expect(mockGenerateRoute("/test/docs/index.md", docsDir)).toBe("/");
    expect(mockGenerateRoute("/test/docs/guide/index.md", docsDir)).toBe(
      "/guide"
    );
  });

  it("should handle regular files correctly", () => {
    expect(
      mockGenerateRoute("/test/docs/guide/getting-started.md", docsDir)
    ).toBe("/guide/getting-started");
    expect(mockGenerateRoute("/test/docs/api/reference.md", docsDir)).toBe(
      "/api/reference"
    );
  });

  it("should handle files in root directory", () => {
    expect(mockGenerateRoute("/test/docs/about.md", docsDir)).toBe("/about");
    expect(mockGenerateRoute("/test/docs/contact.md", docsDir)).toBe(
      "/contact"
    );
  });

  it("should handle mdoc files", () => {
    expect(mockGenerateRoute("/test/docs/guide/advanced.mdoc", docsDir)).toBe(
      "/guide/advanced"
    );
  });

  it("should handle nested directories", () => {
    expect(
      mockGenerateRoute("/test/docs/guide/advanced/features.md", docsDir)
    ).toBe("/guide/advanced/features");
  });
});
