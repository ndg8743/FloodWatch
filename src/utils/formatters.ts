export function formatLevel(meters: number | undefined): string {
  if (meters === undefined) return "--";
  return `${meters.toFixed(2)}m`;
}

export function formatDischarge(m3s: number | undefined): string {
  if (m3s === undefined) return "--";
  return `${m3s.toFixed(0)} m³/s`;
}

export function formatBattery(percent: number): string {
  return `${Math.round(percent)}%`;
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function cfsToM3s(cfs: number): number {
  return cfs * 0.0283168;
}

export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}
