"use client";

import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/material-icon";
import {
  plainFinding,
  type Finding,
  type SourceName,
  type SourceState,
} from "@/components/report/report-utils";

export function SourceIcon({ name }: { name: SourceName }) {
  const icons: Record<SourceName, string> = {
    permissions: "lock",
    dataSafety: "database",
    privacyPolicy: "description",
    aiAnalysis: "visibility",
  };
  return <MaterialIcon name={icons[name]} size={19} />;
}

export function StatusMark({ state }: { state: SourceState }) {
  if (state === "available" || state === "cached") {
    return <MaterialIcon name="check_circle" size={18} fill />;
  }
  if (state === "failed") return <MaterialIcon name="cancel" size={18} fill />;
  return <MaterialIcon name="help" size={18} fill />;
}

export function DetailSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <details className="report-details">
      <summary>
        <span>{title}</span>
        <span className="summary-count">{count}</span>
        <MaterialIcon name="expand_more" size={20} className="summary-caret" />
      </summary>
      <div className="details-body">{children}</div>
    </details>
  );
}

export function EvidenceLinks({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <ul className="evidence-links">
      {ids.map((id) => (
        <li key={id}>
          <a
            href={`#evidence-${encodeURIComponent(id)}`}
            onClick={() => {
              const fullReport = document.getElementById("full-report");
              if (fullReport instanceof HTMLDetailsElement) fullReport.open = true;
              const evidenceGroup = document.getElementById("evidence-group");
              if (evidenceGroup instanceof HTMLDetailsElement) evidenceGroup.open = true;
              const target = document.getElementById(`evidence-${encodeURIComponent(id)}`);
              if (target instanceof HTMLDetailsElement) target.open = true;
              window.setTimeout(
                () => target?.scrollIntoView({ behavior: "smooth", block: "center" }),
                0,
              );
            }}
          >
            See the proof
          </a>
        </li>
      ))}
    </ul>
  );
}

export function FindingList({ findings }: { findings: Finding[] }) {
  if (!findings.length) return <p className="report-empty">No findings in this section.</p>;
  return (
    <div className="expanded-finding-list">
      {findings.map((item) => {
        const plain = plainFinding(item);
        return (
          <article key={item.id} className="expanded-finding">
            <h3>{plain.title}</h3>
            <p>{plain.explanation}</p>
            <EvidenceLinks ids={item.evidenceIds} />
          </article>
        );
      })}
    </div>
  );
}
