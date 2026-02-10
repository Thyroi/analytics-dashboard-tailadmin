import type { analyticsdata_v1beta } from "googleapis";

const MAX_GA4_CONCURRENT = Number(
  process.env.GA4_MAX_CONCURRENT ??
    process.env.NEXT_PUBLIC_GA4_MAX_CONCURRENT ??
    2,
);

let active = 0;
const queue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (active >= MAX_GA4_CONCURRENT) {
    await new Promise<void>((resolve) => queue.push(resolve));
  }
  active += 1;
}

function releaseSlot() {
  active = Math.max(0, active - 1);
  const next = queue.shift();
  if (next) next();
}

export async function runReportLimited(
  analyticsData: analyticsdata_v1beta.Analyticsdata,
  request: analyticsdata_v1beta.Params$Resource$Properties$Runreport,
) {
  await acquireSlot();
  try {
    return await analyticsData.properties.runReport(request);
  } finally {
    releaseSlot();
  }
}
