export interface DocMeta {
  path: string;
  route: string;
  title: string;
  headings: Heading[];
  frontMatter: Record<string, any>;
  links: Link[];
  html: string;
}

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export interface Link {
  href: string;
  text: string;
  type: "internal" | "external";
  target?: string;
  hash?: string;
}

export interface ContentIndex {
  byRoute: Map<string, DocMeta>;
  byPath: Map<string, DocMeta>;
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
