/** Bump to re-show the tour after a major UI change. */
export const TOUR_VERSION = 1;

export function tourStorageKey(version: number, employeeId: string) {
  return `spendflow_tour_v${version}_${employeeId}`;
}
