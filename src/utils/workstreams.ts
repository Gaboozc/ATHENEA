export type RolePermission = {
  view: string[];
  action: string[];
};

export type Workstream = {
  id: string;
  label: string;
  enabled: boolean;
  permissions: RolePermission;
};

const DEFAULT_PERMISSIONS = {
  view: ["Engineer", "Sales", "Manager"],
  action: ["Engineer", "Manager"]
};

export const DEFAULT_WORKSTREAMS: Workstream[] = [
  {
    id: "dev",
    label: "Dev Team",
    enabled: true,
    permissions: DEFAULT_PERMISSIONS
  },
  {
    id: "design",
    label: "Design Team",
    enabled: true,
    permissions: DEFAULT_PERMISSIONS
  },
  {
    id: "cs",
    label: "CS Team",
    enabled: true,
    permissions: {
      view: ["Sales", "Manager"],
      action: ["Sales", "Manager"]
    }
  },
  {
    id: "management",
    label: "Management Team",
    enabled: true,
    permissions: {
      view: ["Engineer", "Sales", "Manager"],
      action: ["Engineer", "Sales", "Manager"]
    }
  }
];

export const getEnabledWorkstreams = () =>
  DEFAULT_WORKSTREAMS.filter((stream) => stream.enabled);
