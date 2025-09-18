import * as Markdoc from "@markdoc/markdoc";
import matter from "gray-matter";
import { Heading, Link } from "./types";

export interface MarkdocResult {
  html: string;
  frontMatter: Record<string, any>;
  headings: Heading[];
  links: Link[];
}

export function renderMarkdocToHtml(src: string): MarkdocResult {
  const { data: frontMatter, content } = matter(src);
  const ast = Markdoc.parse(content);
  const transformedAst = Markdoc.transform(ast);
  const html = Markdoc.renderers.html(transformedAst);

  return {
    html,
    frontMatter,
    headings: [],
    links: [],
  };
}

export function extractTitle({
  frontMatter,
}: {
  frontMatter: Record<string, any>;
  headings: Heading[];
}): string {
  return frontMatter.title || "Untitled";
}
