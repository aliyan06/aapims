import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, Eye, Info, Lock, Plus, RotateCcw, ShieldOff, UserCog } from "lucide-react";
import {
  DataTable,
  DescriptionList,
  Drawer,
  EmptyState,
  Field,
  PortalPage,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAgent, operatorName } from "@/data";
import type { AgentRecord, VerificationStatus } from "@/data/types";
import {
  formatDate,
  useAgents,
  useAppStore,
  useClockIso,
  useOperator,
  usePermission,
  useWorld,
} from "@/store";
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
  const registerAgent = useAppStore((s) => s.registerAgent);
  const clockIso = useClockIso();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [loaReference, setLoaReference] = useState("");
  const [powerOfAttorney, setPowerOfAttorney] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(() => clockIso.slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(() => {
    const date = new Date(clockIso);
    date.setUTCFullYear(date.getUTCFullYear() + 1);
    return date.toISOString().slice(0, 10);
  });
  const [formError, setFormError] = useState<string | null>(null);

  const rows = agents.filter((agent) => agent.operatorId === operator.id);
  const selected = getAgent(world, selectedId);

  function resetForm() {
    setName("");
    setAgentId("");
    setLoaReference("");
    setPowerOfAttorney("");
    setEffectiveDate(clockIso.slice(0, 10));
    const date = new Date(clockIso);
    date.setUTCFullYear(date.getUTCFullYear() + 1);
    setExpiryDate(date.toISOString().slice(0, 10));
    setFormError(null);
  }

  function closeAddForm() {
    resetForm();
    setAddOpen(false);
  }

  function submitAddAgent() {
    if (!name.trim() || !agentId.trim()) {
      setFormError("Agent name and agent ID are required.");
      return;
    }
    const created = registerAgent({
      name: name.trim(),
      agentId: agentId.trim(),
      loaReference: loaReference.trim(),
      powerOfAttorney: powerOfAttorney.trim(),
      effectiveDate,
      expiryDate,
    });
    if (created) closeAddForm();
  }

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
      actions={
        canManage ? (
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add agent
          </Button>
        ) : undefined
      }
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

      <Drawer
        open={addOpen}
        onClose={closeAddForm}
        title="Add agent"
        description="Register an authorised agent to submit permit applications on your behalf."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={closeAddForm}>
              Cancel
            </Button>
            <Button onClick={submitAddAgent}>
              <Plus size={15} /> Register agent
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-info-soft bg-info-soft/50 px-3.5 py-2.5">
            <Info size={16} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[12px] text-text-muted">
              The authority verifies the Letter of Authorization before the agent can submit. Newly
              registered agents start as pending verification.
            </p>
          </div>

          {formError ? (
            <div className="rounded-lg border border-status-rejected/40 bg-status-rejected-soft px-3.5 py-2.5 text-[12px] font-medium text-status-rejected">
              {formError}
            </div>
          ) : null}

          <Field label="Agent name" required hint="Registered name of the authorised agent">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Aviation Services Ltd."
            />
          </Field>
          <Field label="Agent ID" required hint="For example: AG-001">
            <Input
              value={agentId}
              onChange={(event) => setAgentId(event.target.value)}
              placeholder="AG-"
            />
          </Field>
          <Field label="LoA reference" hint="Letter of Authorization reference">
            <Input
              value={loaReference}
              onChange={(event) => setLoaReference(event.target.value)}
              placeholder="Pending"
            />
          </Field>
          <Field label="Power of Attorney" hint="Reference or scope of the power of attorney">
            <Input
              value={powerOfAttorney}
              onChange={(event) => setPowerOfAttorney(event.target.value)}
              placeholder="Pending"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Effective date" hint="YYYY-MM-DD">
              <Input
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
                placeholder="2026-10-10"
              />
            </Field>
            <Field label="Expiry date" hint="YYYY-MM-DD">
              <Input
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                placeholder="2027-10-10"
              />
            </Field>
          </div>
        </div>
      </Drawer>
    </PortalPage>
  );
}
