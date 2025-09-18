import { ContentIndex, SidebarItem } from "./types";

export function generateSidebar(
  index: ContentIndex,
  order: string[] = []
): SidebarItem[] {
  const docs = Array.from(index.byRoute.values());

  // Simple flat list, apply order if specified
  const items: SidebarItem[] = docs.map((doc) => ({
    title: doc.title,
    route: doc.route,
  }));

  if (order.length > 0) {
    return items.sort((a, b) => {
      const aIndex = order.findIndex((pattern) =>
        a.route.includes(pattern.replace(/\.(md|mdoc)$/, ""))
      );
      const bIndex = order.findIndex((pattern) =>
        b.route.includes(pattern.replace(/\.(md|mdoc)$/, ""))
      );
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.title.localeCompare(b.title);
    });
  }

  return items.sort((a, b) => a.title.localeCompare(b.title));
}
