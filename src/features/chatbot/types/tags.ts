export type Granularity = "d" | "w" | "m" | "y";

export type SeriesPoint = {
  time: string; // formato depende de la granularidad
  value: number;
};

export type AuditTagsOutput = Record<string, SeriesPoint[]>;

export type AuditTagsResponse = {
  code: number;
  output: AuditTagsOutput;
};

export type AuditTagsBody = {
  pattern: string;
  granularity: Granularity;
  startTime?: string;
  endTime?: string;
  // db lo agrega el server proxy
};
