import { Skeleton } from "@/components/ui/skeleton";

export function ReportSkeleton({ appId }: { appId: string }) {
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
