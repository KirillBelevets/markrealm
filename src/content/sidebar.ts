import { ContentIndex, SidebarItem, DocMeta } from "./types";

export function generateSidebar(
  index: ContentIndex,
  order: string[] = []
): SidebarItem[] {
  // Convert index to flat array of documents
  const docs = Array.from(index.byRoute.values());

  // Build hierarchical tree from routes
  const tree = buildTree(docs);

  // Apply ordering strategy
  if (order.length === 0) {
    return sortTreeAlphabetically(tree); // Automatic alphabetical ordering
  }

  return applyOrdering(tree, order); // Custom user-defined ordering
}

function buildTree(docs: DocMeta[]): SidebarItem[] {
  const tree: SidebarItem[] = [];
  const pathMap = new Map<string, SidebarItem[]>();

  // Create a map of path segments to their children
  for (const doc of docs) {
    // Split route into segments: "/guide/intro" -> ["guide", "intro"]
    const segments = doc.route.split("/").filter(Boolean);
    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      // Ensure parent has children array
      if (!pathMap.has(parentPath)) {
        pathMap.set(parentPath, []);
      }

      const children = pathMap.get(parentPath)!;

      // Check if this segment already exists
      let existingItem = children.find(
        (item) =>
          item.route === `/${currentPath}` ||
          (i === segments.length - 1 && item.route === doc.route)
      );

      if (!existingItem) {
        if (i === segments.length - 1) {
          // Final segment - this is a document leaf
          existingItem = {
            title: doc.title,
            route: doc.route,
          };
        } else {
          // This is a directory
          existingItem = {
            title: formatTitle(segment), // Format directory name
            route: `/${currentPath}`, // Directory route
            children: [], // Directory has children
          };
        }
        children.push(existingItem); // Add to parent's children
      }

      // If this is the last segment and we have a document - update the title
      if (i === segments.length - 1 && existingItem) {
        existingItem.title = doc.title;
      }
    }
  }

  // Return root level items
  return pathMap.get("") || [];
}

function applyOrdering(tree: SidebarItem[], order: string[]): SidebarItem[] {
  const ordered: SidebarItem[] = [];
  const remaining = [...tree];

  // Process exact matches first
  for (const pattern of order) {
    if (!pattern.includes("*")) {
      // Exact filename match
      const found = remaining.findIndex(
        (item) =>
          item.route === `/${pattern.replace(/\.(md|mdoc)$/, "")}` ||
          item.route === `/${pattern.replace(/\.(md|mdoc)$/, "")}/`
      );

      if (found !== -1) {
        ordered.push(remaining.splice(found, 1)[0]);
      }
    }
  }

  // Process glob patterns
  for (const pattern of order) {
    if (pattern.includes("*")) {
      // Convert glob to regex: "guide/*" -> /guide\/.*/
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));

      // Find all matches
      const matches = remaining.filter(
        (item) => regex.test(item.route.substring(1)) // Remove leading slash
      );

      for (const match of matches) {
        const index = remaining.indexOf(match);
        if (index !== -1) {
          ordered.push(remaining.splice(index, 1)[0]);
        }
      }
    }
  }

  // Add remaining items alphabetically
  ordered.push(...sortTreeAlphabetically(remaining));

  return ordered;
}

function sortTreeAlphabetically(tree: SidebarItem[]): SidebarItem[] {
  return tree
    .sort((a, b) => {
      // Sort by title, but put directories before files
      if (a.children && !b.children) return -1; // a is directory, b is file
      if (!a.children && b.children) return 1; // a is file, b is directory

      return a.title.localeCompare(b.title); // Alphabetical by title
    })
    .map((item) => ({
      ...item,
      children: item.children
        ? sortTreeAlphabetically(item.children) // Recursively sort children
        : undefined,
    }));
}

function formatTitle(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
