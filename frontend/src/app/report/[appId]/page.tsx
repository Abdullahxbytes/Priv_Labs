import { ReportView } from "@/components/report-view";
export default async function ReportPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  return <ReportView key={appId} appId={appId} />;
}
