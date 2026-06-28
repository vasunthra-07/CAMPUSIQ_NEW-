/** Central registry of all TanStack Query keys to prevent duplication */
export const QUERY_KEYS = {
  students: {
    all: ["students"] as const,
    byId: (id: string) => ["students", id] as const,
    byDept: (dept: string) => ["students", "dept", dept] as const,
  },
  campus: {
    pulse: ["campus", "pulse"] as const,
    resources: ["campus", "resources"] as const,
    events: ["campus", "events"] as const,
    complaints: ["campus", "complaints"] as const,
    assets: ["campus", "assets"] as const,
    maintenance: ["campus", "maintenance"] as const,
    transport: ["campus", "transport"] as const,
    library: ["campus", "library"] as const,
    analytics: ["campus", "analytics"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
} as const;
