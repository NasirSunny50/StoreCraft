import { auth } from "@/lib/auth";
import { buildReportCsv } from "@/lib/reports/report-csv";

export async function GET(req: Request) {
  // Route handlers aren't covered by the (admin) layout — guard explicitly.
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const { filename, csv } = await buildReportCsv(new URL(req.url).searchParams);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
