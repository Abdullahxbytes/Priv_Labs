"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { reportSchema, safeLink, type PrivacyReport } from "@/lib/report";

const sourceLabels = {
  permissions: "Permissions",
  dataSafety: "Google Play",
  privacyPolicy: "Privacy policy",
  aiAnalysis: "Policy analysis",
} as const;

type SourceName = keyof typeof sourceLabels;
type SourceState = PrivacyReport["sourceStatus"][SourceName];
type Finding = PrivacyReport["mismatches"][number];

const friendlyNames: Record<string, string> = {
  app_activity: "App activity",
  app_interactions: "App interactions",
  crash_logs: "Crash logs",
  device_identifiers: "Device identifiers",
  financial_information: "Financial information",
  health_information: "Health information",
  precise_location: "Precise location",
  approximate_location: "Approximate location",
  full_network_access: "Network access",
};

function humanize(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return (
    friendlyNames[normalized] ??
    normalized.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function isReady(state: SourceState): boolean {
  return state === "available" || state === "cached";
}

function SourceIcon({ name }: { name: SourceName }) {
  const icons: Record<SourceName, string> = {
    permissions: "lock",
    dataSafety: "database",
    privacyPolicy: "description",
    aiAnalysis: "visibility",
  };
  return <MaterialIcon name={icons[name]} size={19} />;
}

function StatusMark({ state }: { state: SourceState }) {
  if (isReady(state)) return <MaterialIcon name="check_circle" size={18} fill />;
  if (state === "failed") return <MaterialIcon name="cancel" size={18} fill />;
  return <MaterialIcon name="help" size={18} fill />;
}

function DetailSection({
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

function EvidenceLinks({ ids }: { ids: string[] }) {
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
            View supporting excerpt
          </a>
        </li>
      ))}
    </ul>
  );
}

function FindingList({ findings }: { findings: Finding[] }) {
  if (!findings.length) return <p className="report-empty">No findings in this section.</p>;
  return (
    <div className="expanded-finding-list">
      {findings.map((item) => (
        <article key={item.id} className="expanded-finding">
          <h3>{humanize(item.title)}</h3>
          <p>{item.explanation}</p>
          <EvidenceLinks ids={item.evidenceIds} />
        </article>
      ))}
    </div>
  );
}

function ReportSkeleton({ appId }: { appId: string }) {
  return (
    <section className="report-loading" role="status" aria-label="Generating privacy report">
      <span className="sr-only">Generating the privacy report for {appId}.</span>
      <div className="report-loading-nav">
        <Skeleton className="skeleton-back" />
      </div>
      <div className="report-skeleton-board" aria-hidden="true">
        <div className="report-skeleton-header">
          <Skeleton className="skeleton-app-icon" />
          <div>
            <Skeleton className="skeleton-app-name" />
            <Skeleton className="skeleton-developer" />
          </div>
          <Skeleton className="skeleton-coverage" />
        </div>
        <div className="report-skeleton-grid">
          <div>
            <Skeleton className="skeleton-label" />
            <Skeleton className="skeleton-score" />
            <Skeleton className="skeleton-caption" />
            <Skeleton className="skeleton-badge" />
          </div>
          <div>
            <Skeleton className="skeleton-label" />
            <Skeleton className="skeleton-title-wide" />
            <Skeleton className="skeleton-title-short" />
            <Skeleton className="skeleton-caption-wide" />
            <div className="skeleton-reasons">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          </div>
          <div>
            <Skeleton className="skeleton-label" />
            <div className="skeleton-chips">
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
            <Skeleton className="skeleton-note" />
          </div>
        </div>
        <div className="report-skeleton-actions">
          <Skeleton />
          <Skeleton />
        </div>
      </div>
    </section>
  );
}

export function ReportView({ appId }: { appId: string }) {
  const [report, setReport] = useState<PrivacyReport | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (report) {
      document.title = `${report.app.name} privacy report | Priv Lab`;
      headingRef.current?.focus();
    }
  }, [report]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/analyze/${encodeURIComponent(appId)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok)
          throw new Error(
            response.status === 404
              ? "This app could not be found on Google Play."
              : response.status === 504
                ? "Analysis took too long. Please retry."
                : "Analysis is temporarily unavailable. Please retry.",
          );
        const parsed = reportSchema.safeParse(await response.json());
        if (!parsed.success || parsed.data.app.appId !== appId)
          throw new Error("The report could not be validated. Please retry.");
        if (!controller.signal.aborted) setReport(parsed.data);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : "Analysis failed.");
      }
    }
    void load();
    return () => controller.abort();
  }, [appId, attempt]);

  if (!report && !error) return <ReportSkeleton appId={appId} />;
  if (!report)
    return (
      <section className="analysis-state">
        <Link href="/" className="back-link">
          <MaterialIcon name="arrow_back" size={18} />
          Search another app
        </Link>
        <div className="analysis-state-panel">
          <div className="analysis-state-icon">
            <MaterialIcon name="error" size={30} />
          </div>
          <h1>We could not finish this check</h1>
          <p className="package-id">{appId}</p>
          <p role="alert" className="state-message">
            {error}
          </p>
          <button
            onClick={() => {
              setError("");
              setAttempt((value) => value + 1);
            }}
            className="primary-button"
          >
            Retry analysis
          </button>
        </div>
      </section>
    );

  const sourceEntries = Object.entries(report.sourceStatus) as [SourceName, SourceState][];
  const readySources = sourceEntries.filter(([, state]) => isReady(state)).length;
  const complete = readySources === sourceEntries.length;
  const mismatches = report.mismatches.filter(
    (item) =>
      item.type === "PERMISSION_DISCLOSURE_MISMATCH" || item.type === "DATA_SAFETY_POLICY_MISMATCH",
  );
  const notices = report.mismatches.filter(
    (item) => item.type === "UNCLEAR_DISCLOSURE" || item.type === "INSUFFICIENT_INFORMATION",
  );
  const positives = report.positiveFindings.filter((item) => item.evidenceIds.length > 0);
  const missingSources = sourceEntries
    .filter(([, state]) => !isReady(state))
    .map(([name]) => sourceLabels[name]);
  const topFindings = [...mismatches, ...notices]
    .filter(
      (item, index, list) =>
        list.findIndex((candidate) => candidate.title === item.title) === index,
    )
    .slice(0, 3);
  const sensitiveAccess = [
    ...new Set(report.permissions.map((item) => humanize(item.category ?? item.name))),
  ];
  const visibleAccess = sensitiveAccess.slice(0, 3);
  const hiddenAccess = Math.max(0, sensitiveAccess.length - visibleAccess.length);

  const verdict = !complete
    ? {
        tone: "unknown",
        icon: "help",
        label: "Not enough evidence",
        action: "Check the missing source before deciding",
        detail: `${readySources} of ${sourceEntries.length} sources were available.`,
      }
    : report.riskLevel === "VERY HIGH" || report.riskLevel === "HIGH"
      ? {
          tone: "high",
          icon: "warning",
          label: "High privacy concern",
          action: "Review the findings before installing",
          detail: "The available disclosures contain important privacy concerns.",
        }
      : report.riskLevel === "MODERATE" || mismatches.length > 0 || notices.length > 0
        ? {
            tone: "caution",
            icon: "report",
            label: "Review before installing",
            action: "Check the highlighted access and disclosures",
            detail: "The available sources need a closer look.",
          }
        : {
            tone: "low",
            icon: "verified_user",
            label: "Lower privacy concern",
            action: "No major disclosure conflict was found",
            detail: "This result covers published disclosures, not observed behavior.",
          };

  const condensedNotice: Finding | null =
    notices.length > 1
      ? {
          ...notices[0],
          id: "condensed-limitations",
          title: "Comparison coverage incomplete",
          explanation: `${notices.length} checks could not be completed${missingSources.length ? ` because ${missingSources.join(", ")} was unavailable` : " from the available evidence"}. Missing information remains unknown.`,
          evidenceIds: [...new Set(notices.flatMap((item) => item.evidenceIds))],
        }
      : (notices[0] ?? null);
  const storeUrl = safeLink(report.app.storeUrl);
  const iconUrl = report.app.icon?.startsWith("https://") ? report.app.icon : undefined;

  return (
    <article className="report-page">
      <nav aria-label="Report navigation" className="report-nav">
        <Link href="/" className="back-link">
          <MaterialIcon name="arrow_back" size={18} />
          Search another app
        </Link>
        {storeUrl && (
          <a className="store-link" href={storeUrl} target="_blank" rel="noopener noreferrer">
            Google Play
            <MaterialIcon name="open_in_new" size={16} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </nav>

      <section className={`decision-board ${verdict.tone}`} aria-labelledby="report-title">
        <header className="decision-app">
          <div className="app-identity">
            {iconUrl ? (
              <Image
                src={iconUrl}
                width={64}
                height={64}
                alt=""
                unoptimized
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="app-fallback" aria-hidden>
                {report.app.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 id="report-title" ref={headingRef} tabIndex={-1}>
                {report.app.name}
              </h1>
              <p>{report.app.developer ?? "Developer not listed"}</p>
            </div>
          </div>
          <div
            className="coverage-inline"
            aria-label={`${readySources} of ${sourceEntries.length} sources available`}
          >
            <span>
              {readySources}/{sourceEntries.length}
            </span>
            <span>sources checked</span>
          </div>
        </header>

        <div className="decision-grid">
          <div className="score-block">
            <p className="decision-label">Privacy score</p>
            <div className="score-value">
              <strong>{report.score}</strong>
              <span>/100</span>
            </div>
            <p className="score-caption">Based on available disclosures</p>
            <div className={`risk-badge ${verdict.tone}`}>
              <MaterialIcon name={verdict.icon} size={19} fill />
              {verdict.label}
            </div>
          </div>
          <div className="decision-copy">
            <p className="decision-label">Your decision</p>
            <h2>{verdict.action}</h2>
            <p className="decision-detail">{verdict.detail}</p>
            <div className="reason-list" aria-label="Key reasons">
              {topFindings.length > 0 ? (
                topFindings.map((item) => (
                  <div className="reason-row" key={item.id}>
                    <MaterialIcon
                      name={item.type === "INSUFFICIENT_INFORMATION" ? "help" : "priority_high"}
                      size={18}
                    />
                    <div>
                      <strong>{humanize(item.title)}</strong>
                      <EvidenceLinks ids={item.evidenceIds} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="reason-row">
                  <MaterialIcon name="check" size={18} />
                  <strong>No major disclosure conflicts found</strong>
                </div>
              )}
            </div>
          </div>
          <aside className="access-block" aria-label="Sensitive access overview">
            <p className="decision-label">Sensitive access</p>
            {visibleAccess.length ? (
              <ul className="access-chips">
                {visibleAccess.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {hiddenAccess > 0 && <li className="more-chip">+{hiddenAccess} more</li>}
              </ul>
            ) : (
              <p className="compact-empty">No permission data was available.</p>
            )}
            <p className="permission-note">
              Access requests show capability, not proof of collection.
            </p>
          </aside>
        </div>

        <footer className="decision-actions">
          <button
            className="primary-report-action"
            onClick={() => {
              const details = document.getElementById("full-report");
              if (details instanceof HTMLDetailsElement) {
                details.open = true;
                details.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            <MaterialIcon name="description" size={19} />
            View full evidence
          </button>
          {storeUrl && (
            <a
              className="secondary-report-action"
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Google Play
              <MaterialIcon name="open_in_new" size={17} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </footer>
      </section>

      <details id="full-report" className="full-report">
        <summary>
          <div>
            <strong>Full privacy report</strong>
            <span>Sources, disclosures, limitations, and evidence</span>
          </div>
          <MaterialIcon name="expand_more" size={24} className="summary-caret" />
        </summary>
        <div className="full-report-body">
          <section className="report-section" aria-labelledby="coverage-title">
            <div className="section-title">
              <div>
                <p>Source coverage</p>
                <h2 id="coverage-title">What was checked</h2>
              </div>
              <span>
                {readySources} of {sourceEntries.length} available
              </span>
            </div>
            <div className="coverage-grid">
              {sourceEntries.map(([name, state]) => (
                <div key={name} className={`coverage-item ${isReady(state) ? "ready" : "missing"}`}>
                  <SourceIcon name={name} />
                  <span>{sourceLabels[name]}</span>
                  <span className="coverage-status">
                    <StatusMark state={state} />
                    {state === "cached" ? "Cached" : humanize(state)}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="report-section" aria-label="Detailed findings">
            <DetailSection title="Possible disclosure gaps" count={mismatches.length}>
              <FindingList findings={mismatches} />
            </DetailSection>
            <DetailSection title="Requested permissions" count={report.permissions.length}>
              {report.permissions.length ? (
                <ul className="detail-chip-list">
                  {report.permissions.map((item, index) => (
                    <li key={`${item.raw ?? item.name}-${index}`}>
                      {humanize(item.category ?? item.name)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="report-empty">No permission findings were available.</p>
              )}
            </DetailSection>
            <DetailSection title="Collection disclosed" count={report.dataCollected.length}>
              {report.dataCollected.length ? (
                <ul className="data-detail-list">
                  {report.dataCollected.map((item, index) => (
                    <li key={`${item.type}-${index}`}>
                      <strong>{humanize(item.label)}</strong>
                      <span>
                        {item.purposes.length
                          ? item.purposes.map(humanize).join(", ")
                          : "Purpose not specified"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="report-empty">
                  No collection finding was returned. This does not prove collection is absent.
                </p>
              )}
            </DetailSection>
            <DetailSection title="Sharing disclosed" count={report.dataShared.length}>
              {report.dataShared.length ? (
                <ul className="data-detail-list">
                  {report.dataShared.map((item, index) => (
                    <li key={`${item.type}-${index}`}>
                      <strong>{humanize(item.label)}</strong>
                      <span>
                        {item.recipients.length
                          ? `Shared with ${item.recipients.join(", ")}`
                          : "Recipient not specified"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="report-empty">
                  No sharing finding was returned. This does not prove sharing is absent.
                </p>
              )}
            </DetailSection>
          </section>
          {(condensedNotice || positives.length > 0) && (
            <section className="report-context-grid">
              {condensedNotice && (
                <article className="report-context-panel limitation">
                  <MaterialIcon name="help" size={22} />
                  <div>
                    <p className="context-label">Limitations</p>
                    <h2>{humanize(condensedNotice.title)}</h2>
                    <p>{condensedNotice.explanation}</p>
                    <EvidenceLinks ids={condensedNotice.evidenceIds} />
                  </div>
                </article>
              )}
              {positives.length > 0 && (
                <article className="report-context-panel positive">
                  <MaterialIcon name="verified" size={22} />
                  <div>
                    <p className="context-label">Supported practices</p>
                    <h2>Positive signals</h2>
                    <ul>
                      {positives.map((item) => (
                        <li key={item.id}>
                          <strong>{item.title}</strong>
                          <span>{item.explanation}</span>
                          <EvidenceLinks ids={item.evidenceIds} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              )}
            </section>
          )}
          <section className="report-section report-evidence" aria-label="Evidence and methodology">
            <details id="evidence-group" className="report-details">
              <summary>
                <span>Evidence excerpts</span>
                <span className="summary-count">{report.evidence.length}</span>
                <MaterialIcon name="expand_more" size={20} className="summary-caret" />
              </summary>
              <div className="details-body">
                {report.evidence.map((item) => (
                  <details
                    id={`evidence-${encodeURIComponent(item.id)}`}
                    key={item.id}
                    className="evidence-item"
                  >
                    <summary>
                      <span>{humanize(item.category)}</span>
                      <span>
                        {sourceLabels[item.source]} · {humanize(item.status)}
                      </span>
                      <MaterialIcon name="expand_more" size={18} className="summary-caret" />
                    </summary>
                    <div>
                      <p className="evidence-quote">
                        {item.excerpt ?? "No excerpt was provided for this finding."}
                      </p>
                      {safeLink(item.sourceUrl) && (
                        <a
                          href={safeLink(item.sourceUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open original source
                          <MaterialIcon name="open_in_new" size={15} />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      )}
                    </div>
                  </details>
                ))}
                {!report.evidence.length && (
                  <p className="report-empty">No evidence excerpts were returned.</p>
                )}
              </div>
            </details>
            <DetailSection title="How to read this report" count={3}>
              <ul className="reading-notes">
                <li>Permissions show requested capabilities, not observed collection.</li>
                <li>Data Safety and privacy policy content are developer-provided disclosures.</li>
                <li>
                  AI can misread legal text. This report is informational and is not legal advice.
                </li>
              </ul>
            </DetailSection>
          </section>
        </div>
      </details>
    </article>
  );
}
