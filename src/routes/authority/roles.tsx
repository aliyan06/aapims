import { Check, Minus, ShieldCheck, Users } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { DataTable, KpiTile, PortalPage, SectionCard, type Column } from "@/components/desktop";
import { ROLE_LABEL } from "@/components/shell/roles";
import type { RbacPermission, Role } from "@/data/types";
import { PERMISSION_LABEL, type PermissionKey } from "@/lib/rbac";
import { useRbacPermissions, useRbacRoles } from "@/store";

export const Route = createFileRoute("/authority/roles")({
  component: RolesMatrix,
});

/**
 * Maps an RBAC role definition to the coarse permission role used by
 * `permission.roles`. Super Admin maps to `superadmin`, which holds every key.
 */
const RBAC_TO_PERMISSION_ROLE: Record<string, Role> = {
  "super-admin": "superadmin",
  "permit-reviewer": "reviewer",
  "permit-approver": "approver",
  "finance-officer": "finance",
  "operator-admin": "operatorAdmin",
  "permit-officer": "permitOfficer",
  "operator-finance": "operatorFinance",
  viewer: "viewer",
};

const SIDES: readonly { side: "Authority Side" | "Customer Side"; description: string }[] = [
  { side: "Authority Side", description: "Government authority staff." },
  { side: "Customer Side", description: "Operator and applicant accounts." },
];

type CatalogueRow = {
  key: PermissionKey;
  label: string;
  roles: Role[];
};

function permissionGranted(permission: RbacPermission, roleKey: string): boolean {
  if (roleKey === "super-admin") return true;
  const mapped = RBAC_TO_PERMISSION_ROLE[roleKey];
  return mapped ? permission.roles.includes(mapped) : false;
}

function formatRoles(roles: readonly Role[]): string {
  return roles.length > 0 ? roles.map((role) => ROLE_LABEL[role]).join(", ") : "—";
}

function RolesMatrix() {
  const roles = useRbacRoles();
  const permissions = useRbacPermissions();

  const permissionByKey = new Map(permissions.map((permission) => [permission.key, permission]));
  const catalogue: CatalogueRow[] = (Object.keys(PERMISSION_LABEL) as PermissionKey[]).map(
    (key) => ({
      key,
      label: PERMISSION_LABEL[key],
      roles: permissionByKey.get(key)?.roles ?? [],
    }),
  );

  const columns: Column<RbacPermission>[] = [
    {
      key: "permission",
      header: "Permission",
      cell: (permission) => (
        <span className="font-semibold text-text-dark">{permission.label}</span>
      ),
    },
    ...roles.map((role) => ({
      key: role.key,
      header: (
        <span className="whitespace-nowrap" title={role.side}>
          {role.label}
        </span>
      ),
      align: "center" as const,
      cell: (permission: RbacPermission) =>
        permissionGranted(permission, role.key) ? (
          <Check size={15} className="mx-auto text-status-cleared" />
        ) : (
          <Minus size={15} className="mx-auto text-text-subtle" />
        ),
    })),
  ];

  const catalogueColumns: Column<CatalogueRow>[] = [
    {
      key: "permission",
      header: "Permission",
      cell: (row) => <span className="font-semibold text-text-dark">{row.label}</span>,
    },
    {
      key: "key",
      header: "Key",
      cell: (row) => <span className="font-mono text-[12px] text-text-muted">{row.key}</span>,
    },
    {
      key: "roles",
      header: "Granted to",
      cell: (row) => <span className="text-text-muted">{formatRoles(row.roles)}</span>,
    },
  ];

  return (
    <PortalPage
      title="Roles & Permissions"
      description="The access model behind the authority and operator portals. Read-only reference."
      breadcrumb={[{ label: "Authority" }, { label: "Roles" }]}
    >
      <div className="space-y-5">
        <SectionCard title="How access works">
          <p className="text-[13px] text-text-muted">
            AAPIMS enforces access in two layers.{" "}
            <strong className="text-text-dark">Role-based UI visibility</strong> decides which
            screens, sections and navigation items a signed-in user sees — an Operator Admin lands
            on the operator portal while a Permit Approver lands on the authority approval desk.{" "}
            <strong className="text-text-dark">Permission-based actions</strong> then guard the
            controls those screens expose: each button, decision and transition checks the
            permission catalogue below, so a role only performs the actions it has been granted. The
            matrix is the single source of truth for both layers.
          </p>
        </SectionCard>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiTile label="Roles" value={roles.length} icon={Users} tone="info" />
          <KpiTile
            label="Permissions"
            value={Object.keys(PERMISSION_LABEL).length}
            icon={ShieldCheck}
            tone="success"
          />
          <KpiTile
            label="Super Admin"
            value="Full"
            hint="All permissions granted"
            icon={ShieldCheck}
            tone="revision"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {SIDES.map((group) => (
            <SectionCard key={group.side} title={group.side} description={group.description}>
              <ul className="space-y-2">
                {roles
                  .filter((role) => role.side === group.side)
                  .map((role) => (
                    <li key={role.key} className="rounded-lg border border-border-soft px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-text-dark">{role.label}</span>
                        {role.key === "super-admin" ? (
                          <span className="rounded-full bg-status-revision-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-status-revision">
                            Full access
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[12px] text-text-muted">{role.description}</p>
                    </li>
                  ))}
              </ul>
            </SectionCard>
          ))}
        </div>

        <SectionCard
          title="Permission catalogue"
          description="Every permission in the system and the roles that hold it. Role-based visibility and action guards both resolve through this catalogue."
          padded={false}
        >
          <DataTable
            columns={catalogueColumns}
            rows={catalogue}
            getRowKey={(row) => row.key}
            emptyTitle="No permissions defined"
          />
        </SectionCard>

        <SectionCard
          title="Permission matrix"
          description="Rows are permissions; columns are roles. Super Admin has full access to every permission."
          padded={false}
        >
          <DataTable
            columns={columns}
            rows={permissions}
            getRowKey={(permission) => permission.key}
            emptyTitle="No permissions defined"
          />
        </SectionCard>
      </div>
    </PortalPage>
  );
}
