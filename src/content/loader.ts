import * as fs from "fs";
import * as path from "path";
import { globby } from "globby";
import { DocMeta, ContentIndex } from "./types";
import { renderMarkdocToHtml, extractTitle } from "./markdoc";
import { isIgnoredPath } from "../config";

export async function buildContentIndex(
  docsDir: string,
  ignorePatterns: string[]
): Promise<ContentIndex> {
  // Initialize empty index with dual lookup maps
  const index: ContentIndex = {
    byRoute: new Map(),
    byPath: new Map(),
  };

  try {
    // Find all markdown files
    const files = await globby("**/*.{md,mdoc}", {
      cwd: docsDir,
      absolute: true, // Return absolute paths for consistency
    });

    for (const filePath of files) {
      // Check if file should be ignored
      if (isIgnoredPath(filePath, ignorePatterns)) {
        continue;
      }

      try {
        const docMeta = await loadDocument(filePath, docsDir);
        if (docMeta) {
          // Add to both lookup maps
          index.byRoute.set(docMeta.route, docMeta);
          index.byPath.set(docMeta.path, docMeta);
        }
      } catch (error) {
        // Dont fail entire build for single file errors
        console.warn(`Warning: Failed to load ${filePath}:`, error);
      }
    }
  } catch (error) {
    console.error("Error building content index:", error);
  }

  return index;
}

async function loadDocument(
  filePath: string,
  docsDir: string
): Promise<DocMeta | null> {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    // Process through Markdoc pipeline
    const result = renderMarkdocToHtml(content);

    // Generate route from file path
    const route = generateRoute(filePath, docsDir);

    // Extract title
    const title = extractTitle({
      frontMatter: result.frontMatter,
      headings: result.headings,
    });

    // Package all metadata together
    const docMeta: DocMeta = {
      path: filePath,
      route,
      title,
      headings: result.headings,
      frontMatter: result.frontMatter,
      links: result.links,
      html: result.html,
    };

    return docMeta;
  } catch (error) {
    console.warn(`Warning: Failed to process ${filePath}:`, error);
    return null;
  }
}

function generateRoute(filePath: string, docsDir: string): string {
  const relativePath = path.relative(docsDir, filePath);
  const pathWithoutExt = relativePath.replace(/\.(md|mdoc)$/, "");

  // Handle index files
  if (path.basename(pathWithoutExt) === "index") {
    const dir = path.dirname(pathWithoutExt);
    return dir === "." ? "/" : `/${dir}`;
  }

  // Regular files become "/path/to/file"
  return `/${pathWithoutExt}`;
}

export function updateDocumentInIndex(
  index: ContentIndex,
  filePath: string,
  docsDir: string,
  ignorePatterns: string[]
): void {
  // Remove old entry if exists
  const oldDoc = index.byPath.get(filePath);
  if (oldDoc) {
    index.byRoute.delete(oldDoc.route);
    index.byPath.delete(filePath);
  }

  // Check if file should be ignored
  if (isIgnoredPath(filePath, ignorePatterns)) {
    return;
  }

  // Process updated file and add back to index
  loadDocument(filePath, docsDir)
    .then((docMeta) => {
      if (docMeta) {
        index.byRoute.set(docMeta.route, docMeta);
        index.byPath.set(docMeta.path, docMeta);
      }
    })
    .catch((error) => {
      console.warn(`Warning: Failed to update ${filePath}:`, error);
    });
}

export function removeDocumentFromIndex(
  index: ContentIndex,
  filePath: string
): void {
  const doc = index.byPath.get(filePath);
  if (doc) {
    index.byRoute.delete(doc.route);
    index.byPath.delete(filePath);
  }
}
