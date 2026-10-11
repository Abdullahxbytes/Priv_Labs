"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/material-icon";
import { searchApps, type SearchApp } from "@/lib/search";

function AppIcon({ app }: { app: SearchApp }) {
  const [failed, setFailed] = useState(false);
  const safeUrl = app.icon && /^https:\/\//i.test(app.icon);
  return safeUrl && !failed ? (
    // External app icons have varying hosts; restrict the scheme and avoid sending referrers.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={app.icon!}
      alt=""
      width={58}
      height={58}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="app-result-icon"
    />
  ) : (
    <span aria-hidden="true" className="app-result-icon app-icon-fallback">
      {app.name.slice(0, 1)}
    </span>
  );
}

export function AppSearch() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [results, setResults] = useState<SearchApp[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SearchApp | null>(null);
  const controller = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const analysisRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (selected) analysisRef.current?.focus();
  }, [selected]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    controller.current?.abort();
    const term = query.trim();
    setSelected(null);
    setResults([]);
    if (!term || term.length > 200) {
      setError("Enter an app name of at most 200 characters.");
      setStatus("error");
      inputRef.current?.focus();
      return;
    }
    const current = new AbortController();
    controller.current = current;
    setStatus("loading");
    setError("");
    setSearched(term);
    try {
      const apps = await searchApps(term, current.signal);
      if (current.signal.aborted) return;
      setResults(apps);
      setStatus("success");
    } catch (err) {
      if (current.signal.aborted) return;
      setError(
        err instanceof Error && !err.message.startsWith("Invalid")
          ? err.message
          : "The search service returned an unreadable response. Please retry.",
      );
      setStatus("error");
    }
  }

  return (
    <section id="app-search" className="search-section" aria-label="Find an Android app">
      <div className="search-panel">
        <form onSubmit={submit} role="search" aria-label="Google Play apps">
          <label htmlFor="app-query" className="sr-only">
            Search an Android app
          </label>
          <div className="search-field-wrap">
            <MaterialIcon name="search" size={25} className="search-icon" />
            <input
              ref={inputRef}
              id="app-query"
              type="search"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={200}
              value={query}
              onChange={(event) => {
                controller.current?.abort();
                setQuery(event.target.value);
                setStatus("idle");
                setError("");
                setResults([]);
                setSelected(null);
              }}
              placeholder="Search by app name"
              aria-describedby={error ? "search-hint search-error" : "search-hint"}
              aria-invalid={status === "error" && !query.trim()}
            />
            <button
              className="search-button"
              disabled={status === "loading"}
              type="submit"
              aria-label={status === "error" ? "Retry search" : undefined}
            >
              {status === "loading" ? "Searching…" : status === "error" ? "Retry" : "Search"}
              <MaterialIcon name="arrow_forward" size={19} />
            </button>
          </div>
          <p id="search-hint" className="search-hint">
            <MaterialIcon name="storefront" size={16} /> Live results from Google Play
          </p>
        </form>
      </div>

      {status === "error" && (
        <p id="search-error" role="alert" className="search-error">
          <MaterialIcon name="error" size={20} fill />
          {error}
        </p>
      )}
      <p role="status" aria-live="polite" className="search-status">
        {status === "loading"
          ? "Searching Google Play…"
          : status === "success"
            ? results.length
              ? `${results.length} results for “${searched}”.`
              : `No apps found for “${searched}”. Try a different name.`
            : ""}
      </p>

      {results.length > 0 && (
        <div className="search-results-shell">
          <div className="results-label">
            <span>Matches</span>
            <span>Confirm the developer before continuing</span>
          </div>
          <ul aria-label="Search results" aria-busy={status === "loading"} className="result-list">
            {results.map((app) => {
              const isSelected = selected?.appId === app.appId;
              return (
                <li
                  key={app.appId}
                  className={isSelected ? "app-result-row selected" : "app-result-row"}
                >
                  <AppIcon app={app} />
                  <div className="app-result-copy">
                    <h3>{app.name}</h3>
                    <p>{app.developer ?? "Developer not listed"}</p>
                    <small>{app.appId}</small>
                  </div>
                  <div className="app-result-facts">
                    {app.rating !== null && (
                      <span>
                        <MaterialIcon name="star" size={16} fill />
                        {app.rating.toFixed(1)}
                      </span>
                    )}
                    {app.category && <span>{app.category}</span>}
                  </div>
                  {isSelected ? (
                    <Link
                      ref={analysisRef}
                      href={`/report/${encodeURIComponent(app.appId)}`}
                      aria-label={`Analyze privacy disclosures for ${app.name}`}
                      className="result-report-link"
                    >
                      View report <MaterialIcon name="arrow_forward" size={18} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Select app: ${app.name}`}
                      aria-pressed="false"
                      onClick={() => setSelected(app)}
                      className="result-select-button"
                    >
                      Select <MaterialIcon name="chevron_right" size={20} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
