import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { SiteConfig } from "./content/types";

const DEFAULT_CONFIG: SiteConfig = {
  site: {
    title: "My Docs",
    baseUrl: "/",
  },
  sidebar: {
    order: [],
  },
  linkcheck: {
    enabled: true,
    externalTimeoutMs: 5000,
  },
  ignore: [],
};

export function loadConfig(docsDir: string): SiteConfig {
  const configFiles = [
    "markrealm.config.yaml",
    "markrealm.config.yml",
    "markrealm.config.json",
  ];
  // Search for config files in order of preference
  for (const configFile of configFiles) {
    const configPath = path.join(docsDir, configFile);
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, "utf8");
        let config: Partial<SiteConfig> = {};

        // Parse based on file extension
        if (configFile.endsWith(".json")) {
          config = JSON.parse(content);
        } else {
          config = yaml.load(content) as Partial<SiteConfig>;
        }
        // Merge user config with defaults and return
        return mergeConfig(DEFAULT_CONFIG, config);
      } catch (error) {
        console.warn(
          `Warning: Failed to parse config file ${configFile}:`,
          error
        );
      }
    }
  }

  return DEFAULT_CONFIG;
}

function mergeConfig(
  defaultConfig: SiteConfig,
  userConfig: Partial<SiteConfig>
): SiteConfig {
  return {
    site: {
      ...defaultConfig.site,
      ...userConfig.site,
    },
    sidebar: {
      ...defaultConfig.sidebar,
      ...userConfig.sidebar,
    },
    linkcheck: {
      ...defaultConfig.linkcheck,
      ...userConfig.linkcheck,
    },
    ignore: userConfig.ignore || defaultConfig.ignore,
  };
}

export function isIgnoredPath(
  filePath: string,
  ignorePatterns: string[]
): boolean {
  const relativePath = path.relative(process.cwd(), filePath);

  for (const pattern of ignorePatterns) {
    if (pattern.includes("*")) {
      // Replace * with .* for regex matching and test if glob pattern exists
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      // File matches glob pattern - ignore it
      if (regex.test(relativePath)) {
        return true;
      }
    } else if (relativePath.includes(pattern)) {
      return true;
    }
  }

  return false;
}
