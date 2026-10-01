import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, Eye, Info, Lock, RotateCcw, ShieldOff, UserCog } from "lucide-react";
import {
  DataTable,
  DescriptionList,
  Drawer,
  EmptyState,
  PortalPage,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { getAgent, operatorName } from "@/data";
import type { AgentRecord, VerificationStatus } from "@/data/types";
import { formatDate, useAgents, useAppStore, useOperator, usePermission, useWorld } from "@/store";
import type { StatusTone } from "@/lib/status";

export const Route = createFileRoute("/operator/agents")({
  component: AgentsScreen,
});

const AUTHORIZATION_TONE: Record<VerificationStatus, StatusTone> = {
  VERIFIED: "approved",
  "PENDING VERIFICATION": "submitted",
  REJECTED: "rejected",
};

const AGENT_STATUS_TONE: Record<AgentRecord["status"], StatusTone> = {
  ACTIVE: "cleared",
  SUSPENDED: "awaiting",
  EXPIRED: "expired",
};

function AgentsScreen() {
  const world = useWorld();
  const operator = useOperator();
  const agents = useAgents();
  const canManage = usePermission("agent.manage");
  const suspendAgent = useAppStore((s) => s.suspendAgent);
  const reactivateAgent = useAppStore((s) => s.reactivateAgent);
  const expireAgent = useAppStore((s) => s.expireAgent);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = agents.filter((agent) => agent.operatorId === operator.id);
  const selected = getAgent(world, selectedId);

  const columns: Column<AgentRecord>[] = [
    {
      key: "name",
      header: "Agent Name",
      cell: (agent) => <span className="font-semibold text-text-dark">{agent.name}</span>,
    },
    { key: "agentId", header: "Agent ID", cell: (agent) => agent.agentId },
    {
      key: "authorization",
      header: "Authorization",
      cell: (agent) => (
        <StatusBadge label={agent.authorization} tone={AUTHORIZATION_TONE[agent.authorization]} />
      ),
    },
    { key: "loa", header: "LoA reference", cell: (agent) => agent.loaReference },
    {
      key: "validUntil",
      header: "Valid until",
      cell: (agent) => formatDate(agent.expiryDate),
    },
    {
      key: "status",
      header: "Status",
      cell: (agent) => <StatusBadge label={agent.status} tone={AGENT_STATUS_TONE[agent.status]} />,
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      cell: (agent) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedId(agent.id);
          }}
        >
          <Eye size={14} /> View
        </Button>
      ),
    },
  ];

  return (
    <PortalPage
      title="Agents"
      description="An authorised agent may submit permit applications on your operator's behalf under a valid Letter of Authorization."
      breadcrumb={[{ label: "Operator" }, { label: "Agents" }]}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-info-soft bg-info-soft/50 px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-[12.5px] text-text-muted">
            Permits can only be submitted for a verified operator with a valid, active agent
            authorization. An agent whose authorization is suspended or expired cannot submit on
            your behalf.
          </p>
        </div>

        <SectionCard padded={false}>
          {rows.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="No authorised agents"
              description="You can continue to submit permit applications directly. Add an agent to delegate submissions."
            />
          ) : (
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(agent) => agent.id}
              onRowClick={(agent) => setSelectedId(agent.id)}
              emptyTitle="No authorised agents"
              emptyDescription="You can continue to submit permit applications directly."
            />
          )}
        </SectionCard>
      </div>

      <Drawer
        open={selected !== undefined}
        onClose={() => setSelectedId(null)}
        title={selected ? selected.name : "Agent"}
        description={
          selected ? `Authorised agent for ${operatorName(world, selected.operatorId)}` : undefined
        }
        footer={
          selected ? (
            <div className="space-y-2.5">
              {!canManage ? (
                <div className="flex items-center gap-2 text-[12px] text-text-muted">
                  <Lock size={13} className="text-text-subtle" />
                  You have read-only access to agent authorizations.
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={!canManage || selected.status !== "ACTIVE"}
                  onClick={() => suspendAgent(selected.id)}
                >
                  <Ban size={15} /> Suspend
                </Button>
                <Button
                  variant="destructive"
                  disabled={!canManage || selected.status === "EXPIRED"}
                  onClick={() => expireAgent(selected.id)}
                >
                  <ShieldOff size={15} /> Expire authorization
                </Button>
                <Button
                  disabled={!canManage || selected.status === "ACTIVE"}
                  onClick={() => reactivateAgent(selected.id)}
                >
                  <RotateCcw size={15} /> Reactivate
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        {selected ? (
          <div className="space-y-5">
            <DescriptionList
              items={[
                { label: "Agent name", value: selected.name },
                { label: "Agent ID", value: selected.agentId },
                { label: "Operator", value: operatorName(world, selected.operatorId) },
                { label: "LoA reference", value: selected.loaReference },
                { label: "Power of attorney", value: selected.powerOfAttorney, fullWidth: true },
                { label: "Effective date", value: formatDate(selected.effectiveDate) },
                { label: "Expiry date", value: formatDate(selected.expiryDate) },
                {
                  label: "Authorization status",
                  value: (
                    <StatusBadge
                      label={selected.authorization}
                      tone={AUTHORIZATION_TONE[selected.authorization]}
                    />
                  ),
                },
                {
                  label: "Relationship status",
                  value: (
                    <StatusBadge
                      label={selected.status}
                      tone={AGENT_STATUS_TONE[selected.status]}
                    />
                  ),
                },
              ]}
            />

            <div className="rounded-lg border border-border-soft bg-surface-muted/50 px-3.5 py-2.5 text-[12px] text-text-muted">
              Changes to an agent authorization take effect immediately across the portal and are
              recorded in the audit trail.
            </div>
          </div>
        ) : null}
      </Drawer>
    </PortalPage>
  );
}
