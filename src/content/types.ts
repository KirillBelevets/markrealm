export interface DocMeta {
  path: string; // absolute file path
  route: string; // URL route (e.g., "/guide/getting-started")
  title: string; // page title from front-matter or first H1
  headings: Heading[]; // extracted headings for TOC
  frontMatter: Record<string, any>; // parsed front-matter
  links: Link[]; // extracted links for validation
  html: string; // rendered HTML content
}

export interface Heading {
  level: number; // 1-6
  text: string;
  id: string; // generated anchor ID
}

export interface Link {
  href: string; // original href
  text: string; // link text
  type: "internal" | "external"; // link type
  target?: string; // target file path for internal links
  hash?: string; // fragment identifier
}

export interface ContentIndex {
  byRoute: Map<string, DocMeta>; // route -> DocMeta
  byPath: Map<string, DocMeta>; // absolute path -> DocMeta
}

export interface SidebarItem {
  title: string;
  route: string;
  children?: SidebarItem[];
}

export interface SiteConfig {
  site: {
    title: string;
    baseUrl: string;
  };
  sidebar: {
    order?: string[];
  };
  linkcheck: {
    enabled: boolean;
    externalTimeoutMs: number;
  };
  ignore: string[];
}

export interface BuildOptions {
  dir: string;
  out: string;
  strict?: boolean;
}

export interface DevOptions {
  dir: string;
  port: number;
}
