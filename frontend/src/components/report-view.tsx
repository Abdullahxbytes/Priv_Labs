"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import {
  DetailSection,
  EvidenceLinks,
  FindingList,
  SourceIcon,
  StatusMark,
} from "@/components/report/report-details";
import { ReportSignalCard } from "@/components/report/report-signal-card";
import { ReportSkeleton } from "@/components/report/report-skeleton";
import {
  humanize,
  isReady,
  plainFinding,
  sourceLabels,
  type Finding,
  type SourceName,
  type SourceState,
} from "@/components/report/report-utils";
import { ScoreGauge } from "@/components/report/score-gauge";
import { reportSchema, safeLink, type PrivacyReport } from "@/lib/report";

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
  const sharedData = [
    ...new Set(report.dataShared.map((item) => humanize(item.label ?? item.type))),
  ];
  const warningSigns = [
    ...new Set([...mismatches, ...notices].map((item) => plainFinding(item).title)),
  ];

  const verdict = !complete
    ? {
        tone: "unknown",
        icon: "help",
        label: "Not enough information",
        action: "We cannot give a clear answer yet",
        detail:
          "Some information was missing. Open the details below to see what we could not check.",
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
            <ReportSignalCard
              icon="phonelink_lock"
              label="Can access"
              items={sensitiveAccess}
              emptyMessage="No phone access was found"
            />
            <ReportSignalCard
              icon="share"
              label="Says it shares"
              items={sharedData}
              emptyMessage="No shared data was listed"
            />
            <ReportSignalCard
              icon={warningSigns.length ? "warning" : "fact_check"}
              label="Warning signs"
              items={warningSigns}
              emptyMessage="No major conflict was found"
            />
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
