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
  const index: ContentIndex = { byRoute: new Map(), byPath: new Map() };

  const files = await globby("**/*.{md,mdoc}", {
    cwd: docsDir,
    absolute: true,
  });

  for (const filePath of files) {
    if (isIgnoredPath(filePath, ignorePatterns)) continue;

    const docMeta = loadDocument(filePath, docsDir);
    if (docMeta) {
      index.byRoute.set(docMeta.route, docMeta);
      index.byPath.set(docMeta.path, docMeta);
    }
  }

  return index;
}

function loadDocument(filePath: string, docsDir: string): DocMeta | null {
  const content = fs.readFileSync(filePath, "utf8");
  const result = renderMarkdocToHtml(content);
  const route = generateRoute(filePath, docsDir);
  const title = extractTitle({
    frontMatter: result.frontMatter,
    headings: result.headings,
  });

  return {
    path: filePath,
    route,
    title,
    headings: result.headings,
    frontMatter: result.frontMatter,
    links: result.links,
    html: result.html,
  };
}

function generateRoute(filePath: string, docsDir: string): string {
  const relativePath = path.relative(docsDir, filePath);
  const pathWithoutExt = relativePath.replace(/\.(md|mdoc)$/, "");

  if (path.basename(pathWithoutExt) === "index") {
    const dir = path.dirname(pathWithoutExt);
    return dir === "." ? "/" : `/${dir}`;
  }

  return `/${pathWithoutExt}`;
}

export function updateDocumentInIndex(
  index: ContentIndex,
  filePath: string,
  docsDir: string,
  ignorePatterns: string[]
): void {
  const oldDoc = index.byPath.get(filePath);
  if (oldDoc) {
    index.byRoute.delete(oldDoc.route);
    index.byPath.delete(filePath);
  }

  if (isIgnoredPath(filePath, ignorePatterns)) return;

  const docMeta = loadDocument(filePath, docsDir);
  if (docMeta) {
    index.byRoute.set(docMeta.route, docMeta);
    index.byPath.set(docMeta.path, docMeta);
  }
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
