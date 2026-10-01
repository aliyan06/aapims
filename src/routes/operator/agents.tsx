import { createFileRoute } from "@tanstack/react-router";
import { Info, UserCog } from "lucide-react";
import {
  DataTable,
  EmptyState,
  PortalPage,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/components/desktop";
import type { AgentRecord, VerificationStatus } from "@/data/types";
import { operatorName } from "@/data/lookups";
import { formatDate, useAgents, useOperator, useWorld } from "@/store";
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

  const rows = agents.filter((agent) => agent.operatorId === operator.id);

  const columns: Column<AgentRecord>[] = [
    {
      key: "name",
      header: "Agent",
      cell: (agent) => <span className="font-semibold text-text-dark">{agent.name}</span>,
    },
    { key: "agentId", header: "Agent ID", cell: (agent) => agent.agentId },
    {
      key: "operator",
      header: "Operator",
      cell: (agent) => operatorName(world, agent.operatorId),
    },
    {
      key: "loa",
      header: "LoA reference",
      cell: (agent) => agent.loaReference,
    },
    {
      key: "authorization",
      header: "Authorization",
      cell: (agent) => (
        <StatusBadge label={agent.authorization} tone={AUTHORIZATION_TONE[agent.authorization]} />
      ),
    },
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
  ];

  return (
    <PortalPage
      title="Authorised Agents"
      description="Third parties authorised to act on behalf of your operator for permit applications."
      breadcrumb={[{ label: "Operator" }, { label: "Agents" }]}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-info-soft bg-info-soft/50 px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-[12.5px] text-text-muted">
            Appointing an agent is optional. Your operator may apply for permits directly, or
            authorise an agent using a Letter of Authority and power of attorney.
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
              emptyTitle="No authorised agents"
              emptyDescription="You can continue to submit permit applications directly."
            />
          )}
        </SectionCard>
      </div>
    </PortalPage>
  );
}
