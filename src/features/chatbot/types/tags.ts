export type Granularity = "d" | "w" | "m" | "y";

export type SeriesPoint = {
  time: string;
  value: number;
};

export type AuditTagsOutput = Record<string, SeriesPoint[]>;

export type AuditTagsBody = {
  pattern: string;
  granularity: Granularity;
  startTime?: string;
  endTime?: string;
};

export type AuditNode = {
  key: string;
  path: string;
  label: string;
  count?: number;
  children?: AuditNode[];
};

export type AuditTagsResponse = {
  nodes: AuditNode[];
  total?: number;
};

