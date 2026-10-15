"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { reportSchema, safeLink, type PrivacyReport } from "@/lib/report";

const sourceLabels = {
  permissions: "Phone access",
  dataSafety: "Google Play answers",
  privacyPolicy: "Privacy policy",
  aiAnalysis: "Policy review",
} as const;

type SourceName = keyof typeof sourceLabels;
type SourceState = PrivacyReport["sourceStatus"][SourceName];
type Finding = PrivacyReport["mismatches"][number];

function useAnimatedNumber(target: number, duration = 850): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => setValue(target));
      return () => window.cancelAnimationFrame(frame);
    }

    let frame = 0;
    let startTime: number | null = null;
    const tick = (time: number) => {
      startTime ??= time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
}

function AnimatedNumber({ value, duration }: { value: number; duration?: number }) {
  return <>{useAnimatedNumber(value, duration)}</>;
}

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

function findingSubject(item: Finding): string {
  const fromId = item.id.replace(/^comparison-/, "").replace(/^selective-/, "");
  if (fromId && fromId !== item.id) return humanize(fromId);
  return humanize(item.title.split(" ")[0] ?? "this data");
}

function plainFinding(item: Finding): { title: string; explanation: string } {
  const subject = findingSubject(item);
  if (item.type === "PERMISSION_DISCLOSURE_MISMATCH") {
    return {
      title: `${subject} access is not clearly explained`,
      explanation: `The app asks for ${subject.toLowerCase()} access, but its public information does not clearly explain why.`,
    };
  }
  if (item.type === "DATA_SAFETY_POLICY_MISMATCH") {
    return {
      title: `${subject} details do not match`,
      explanation: `Google Play and the privacy policy say different things about ${subject.toLowerCase()}.`,
    };
  }
  if (item.type === "UNCLEAR_DISCLOSURE") {
    return {
      title: `${subject} details are unclear`,
      explanation: `The privacy policy does not clearly explain how ${subject.toLowerCase()} is handled.`,
    };
  }
  return {
    title: `${subject} could not be checked`,
    explanation: `Some information was missing, so we could not compare the app's statements about ${subject.toLowerCase()}.`,
  };
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

function ScoreGauge({ score, tone }: { score: number; tone: string }) {
  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const animatedScore = useAnimatedNumber(boundedScore, 950);
  const circumference = 2 * Math.PI * 46;
  const offset = circumference * (1 - animatedScore / 100);

  return (
    <div
      className={`score-gauge ${tone}`}
      role="img"
      aria-label={`Privacy score ${boundedScore} out of 100. Higher is better.`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="score-gauge-track" cx="60" cy="60" r="46" />
        <circle
          className="score-gauge-value"
          cx="60"
          cy="60"
          r="46"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-gauge-label">
        <strong>{animatedScore}</strong>
        <span>/100</span>
        <small>Privacy score</small>
      </div>
      <p>Higher is better</p>
    </div>
  );
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
            See the proof
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
  const sensitiveAccess = [
    ...new Set(report.permissions.map((item) => humanize(item.category ?? item.name))),
  ];
  const visibleAccess = sensitiveAccess.slice(0, 2);
  const sharedData = [
    ...new Set(report.dataShared.map((item) => humanize(item.label ?? item.type))),
  ];
  const visibleSharedData = sharedData.slice(0, 2);

  const verdict = !complete
    ? {
        tone: "unknown",
        icon: "help",
        label: "Not enough information",
        action: "We cannot give a clear answer yet",
        detail: "The source pills above show exactly what we could and could not check.",
      }
    : report.riskLevel === "VERY HIGH" || report.riskLevel === "HIGH"
      ? {
          tone: "high",
          icon: "warning",
          label: "High privacy concern",
          action: "Think twice before installing",
          detail: "This app asks for or shares enough personal data to deserve a closer look.",
        }
      : report.riskLevel === "MODERATE" || mismatches.length > 0 || notices.length > 0
        ? {
            tone: "caution",
            icon: "report",
            label: "Some privacy concerns",
            action: "Check what it needs before installing",
            detail:
              "You may be comfortable with this app, but review the access shown below first.",
          }
        : {
            tone: "low",
            icon: "verified_user",
            label: "Lower privacy concern",
            action: "Looks okay from what we checked",
            detail: "We did not find a major conflict in the public privacy information.",
          };

  const condensedNotice: Finding | null =
    notices.length > 1
      ? {
          ...notices[0],
          id: "condensed-limitations",
          title: "Some checks could not be finished",
          explanation: `${notices.length} checks could not be completed${missingSources.length ? ` because we could not use ${missingSources.join(", ")}` : " with the information we found"}. We do not treat missing information as safe.`,
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
          <div className="report-source-pills" aria-label="Information sources checked">
            {sourceEntries.map(([name, state]) => (
              <span
                key={name}
                className={`report-source-pill ${isReady(state) ? "ready" : state}`}
                aria-label={`${sourceLabels[name]}: ${isReady(state) ? "checked" : state === "failed" ? "check failed" : "not found"}`}
              >
                <StatusMark state={state} />
                <span>{sourceLabels[name]}</span>
              </span>
            ))}
          </div>
        </header>

        <div className="verdict-panel">
          <div className="verdict-layout">
            <div className="verdict-copy-main">
              <div className={`verdict-kicker ${verdict.tone}`}>
                <MaterialIcon name={verdict.icon} size={20} fill />
                <span>{verdict.label}</span>
              </div>
              <p className="decision-label">Our privacy answer</p>
              <h2>{verdict.action}</h2>
              <p className="verdict-reason">{verdict.detail}</p>
            </div>
            <ScoreGauge score={report.score} tone={verdict.tone} />
          </div>

          <div className="signal-grid" aria-label="Main privacy findings">
            <article className="report-signal-card">
              <MaterialIcon name="phonelink_lock" size={22} />
              <div>
                <span>Can access</span>
                <strong>
                  {sensitiveAccess.length ? (
                    <>
                      <AnimatedNumber value={sensitiveAccess.length} /> phone area
                      {sensitiveAccess.length === 1 ? "" : "s"}
                    </>
                  ) : (
                    "Nothing we could confirm"
                  )}
                </strong>
                <p>
                  {visibleAccess.length
                    ? visibleAccess.join(" and ")
                    : "No permission list was found"}
                </p>
              </div>
            </article>
            <article className="report-signal-card">
              <MaterialIcon name="share" size={22} />
              <div>
                <span>Says it shares</span>
                <strong>
                  {sharedData.length ? (
                    <>
                      <AnimatedNumber value={sharedData.length} /> type
                      {sharedData.length === 1 ? "" : "s"} of data
                    </>
                  ) : (
                    "No sharing found"
                  )}
                </strong>
                <p>
                  {visibleSharedData.length
                    ? visibleSharedData.join(" and ")
                    : "This is not proof that sharing never happens"}
                </p>
              </div>
            </article>
            <article className="report-signal-card">
              <MaterialIcon name={mismatches.length ? "warning" : "fact_check"} size={22} />
              <div>
                <span>Warning signs</span>
                <strong>
                  {mismatches.length ? (
                    <>
                      <AnimatedNumber value={mismatches.length} /> statement
                      {mismatches.length === 1 ? "" : "s"} do not match
                    </>
                  ) : notices.length ? (
                    <>
                      <AnimatedNumber value={notices.length} /> check
                      {notices.length === 1 ? "" : "s"} unfinished
                    </>
                  ) : (
                    "No major conflict found"
                  )}
                </strong>
                <p>
                  {mismatches.length
                    ? "The app's public information disagrees"
                    : notices.length
                      ? "Some information was missing or unclear"
                      : "The public statements were consistent"}
                </p>
              </div>
            </article>
          </div>

          <div className="report-boundary">
            <MaterialIcon name="info" size={18} />
            <span>
              This checks privacy statements, not viruses, scams, or overall app security.
            </span>
          </div>
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
            See the details
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
            <strong>See the full privacy details</strong>
            <span>Open only if you want the complete explanation and proof</span>
          </div>
          <MaterialIcon name="expand_more" size={24} className="summary-caret" />
        </summary>
        <div className="full-report-body">
          <section className="report-section" aria-labelledby="coverage-title">
            <div className="section-title">
              <div>
                <p>Information checked</p>
                <h2 id="coverage-title">Where this answer came from</h2>
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
                    {state === "cached"
                      ? "Checked earlier"
                      : isReady(state)
                        ? "Checked"
                        : state === "failed"
                          ? "Check failed"
                          : "Not found"}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="report-section" aria-label="Detailed findings">
            <DetailSection title="What did not match?" count={mismatches.length}>
              <FindingList findings={mismatches} />
            </DetailSection>
            <DetailSection title="What can the app access?" count={report.permissions.length}>
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
            <DetailSection title="What data does it collect?" count={report.dataCollected.length}>
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
            <DetailSection title="What data does it share?" count={report.dataShared.length}>
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
                    <p className="context-label">What we could not check</p>
                    <h2>{condensedNotice.title}</h2>
                    <p>{condensedNotice.explanation}</p>
                    <EvidenceLinks ids={condensedNotice.evidenceIds} />
                  </div>
                </article>
              )}
              {positives.length > 0 && (
                <article className="report-context-panel positive">
                  <MaterialIcon name="verified" size={22} />
                  <div>
                    <p className="context-label">Good signs we found</p>
                    <h2>Helpful privacy choices</h2>
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
                <span>Proof from the privacy policy</span>
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
            <DetailSection title="What this report can and cannot tell you" count={3}>
              <ul className="reading-notes">
                <li>Phone access shows what the app can reach, not what it actually collected.</li>
                <li>Google Play and privacy policy details come from the app developer.</li>
                <li>
                  AI can misunderstand legal text. This is guidance, not a security guarantee.
                </li>
              </ul>
            </DetailSection>
          </section>
        </div>
      </details>
    </article>
  );
}
