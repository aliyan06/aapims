import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { EmptyState, PortalPage } from "@/components/desktop";
import type { PermissionKey } from "@/lib/rbac";
import { useActiveRole, usePermission } from "@/store";
import { ROLE_LABEL } from "@/components/shell/roles";

type RequirePermissionProps = {
  permission: PermissionKey;
  title?: string;
  description?: string;
  children: ReactNode;
};

/**
 * Route/action guard (features.md §20, permission-based actions and
 * role-based UI visibility). Renders a clear "not permitted" state instead of
 * the screen when the active role lacks the permission.
 */
export function RequirePermission({
  permission,
  title = "Not permitted for this role",
  description,
  children,
}: RequirePermissionProps) {
  const allowed = usePermission(permission);
  if (allowed) return <>{children}</>;
  return <NotPermitted title={title} description={description} />;
}

export function NotPermitted({
  title = "Not permitted for this role",
  description,
}: {
  title?: string;
  description?: string;
}) {
  const role = useActiveRole();
  return (
    <PortalPage title="Access restricted" breadcrumb={[{ label: "Portal" }]}>
      <EmptyState
        icon={ShieldAlert}
        title={title}
        description={
          description ??
          `You are signed in as ${ROLE_LABEL[role]}, which does not have permission to perform this action.`
        }
      />
    </PortalPage>
  );
}
