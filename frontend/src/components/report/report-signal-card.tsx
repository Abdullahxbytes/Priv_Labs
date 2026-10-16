import { MaterialIcon } from "@/components/material-icon";

type ReportSignalCardProps = {
  icon: string;
  label: string;
  items: string[];
  emptyMessage: string;
};

export function ReportSignalCard({ icon, label, items, emptyMessage }: ReportSignalCardProps) {
  return (
    <article className="report-signal-card">
      <MaterialIcon name={icon} size={22} />
      <div>
        <span>{label}</span>
        {items.length ? (
          <ul className="signal-pill-list" aria-label={`${label} details`}>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="signal-empty">{emptyMessage}</p>
        )}
      </div>
    </article>
  );
}
