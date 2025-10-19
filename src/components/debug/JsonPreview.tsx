"use client";

import React from "react";

export default function JsonPreview({
  data,
  title = "Raw Query Result",
}: {
  data: unknown;
  title?: string;
}) {
  if (data === undefined) {
    return (
      <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg mt-6">
        <h4 className="font-semibold mb-2">🧾 {title}</h4>
        <p className="text-sm text-muted-foreground">No data</p>
      </div>
    );
  }

  const pretty = (() => {
    try {
      return JSON.stringify(data, null, 2);
      } catch {
        return String(data);
    }
  })();

  return (
    <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg mt-6">
      <h4 className="font-semibold mb-2">🧾 {title}</h4>
      <pre className="overflow-auto text-xs max-h-[40vh] p-3 bg-white/80 dark:bg-black/80 rounded">
        {pretty}
      </pre>
    </div>
  );
}
