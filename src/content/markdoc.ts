import * as Markdoc from "@markdoc/markdoc";
import matter from "gray-matter";
import { Heading, Link } from "./types";

export interface MarkdocResult {
  html: string;
  frontMatter: Record<string, any>;
  headings: Heading[];
  links: Link[];
}

export function renderMarkdocToHtml(
  src: string,
  variables: Record<string, any> = {}
): MarkdocResult {
  // Extract front-matter
  const { data: frontMatter, content } = matter(src);

  // Parse Markdoc
  const ast = Markdoc.parse(content);

  // Transform AST
  const config = {
    tags: {
      // Add custom tags here if needed
      // e.g., {% callout type="warning" %}...{% /callout %}
    },
    nodes: {
      // Add custom nodes here if needed
      // e.g., {% code language="javascript" %}...{% /code %}
    },
    variables,
  };

  const transformedAst = Markdoc.transform(ast, config);

  // Render to HTML
  const html = Markdoc.renderers.html(transformedAst);

  // Extract headings and links
  const headings = extractHeadings(ast);
  const links = extractLinks(ast);

  return {
    html,
    frontMatter,
    headings,
    links,
  };
}

export function extractTitle({
  frontMatter,
  headings,
}: {
  frontMatter: Record<string, any>;
  headings: Heading[];
}): string {
  // Prefer explicit front-matter title
  if (frontMatter.title) {
    return frontMatter.title;
  }

  // Fall back to first H1 heading
  const firstH1 = headings.find((h) => h.level === 1);
  if (firstH1) {
    return firstH1.text;
  }

  return "Untitled";
}

function extractHeadings(ast: any): Heading[] {
  const headings: Heading[] = [];

  // Walks through all nodes in the AST tree to find headings
  function traverse(node: any) {
    // Check if current node is a heading
    if (node.type === "heading") {
      const level = node.attributes?.level?.value || 1;
      const text = extractTextContent(node);
      const id = generateHeadingId(text);

      headings.push({
        level,
        text,
        id,
      });
    }

    // Recursively process child nodes
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(ast);
  return headings;
}

function extractLinks(ast: any): Link[] {
  const links: Link[] = [];

  function traverse(node: any) {
    if (node.type === "link") {
      const href = node.attributes?.href?.value || "";
      const text = extractTextContent(node);

      // Skip empty links
      if (!href || !text) {
        return;
      }

      // Check link type based on href pattern
      const isInternal =
        !href.startsWith("http") &&
        !href.startsWith("//") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("#");

      let link: Link = {
        href,
        text,
        type: isInternal ? "internal" : "external",
      };

      if (isInternal) {
        // Split target path and fragment - anchor
        const [target, hash] = href.split("#");
        link.target = target || "";
        if (hash) {
          link.hash = hash;
        }
      }

      links.push(link);
    }

    // Recursively process children
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(ast);
  return links;
}

function extractTextContent(node: any): string {
  // Handle text nodes directly
  if (typeof node === "string") {
    return node;
  }

  // Recursively extract from children
  if (node.children) {
    return node.children.map(extractTextContent).join("");
  }

  return "";
}

// Generate URL-safe heading id
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}
