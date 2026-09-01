export type Timestamp =
  | Date
  | string
  | number
  | { toDate: () => Date };

export function timestampToDate(value: Timestamp): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'object') return value.toDate();
  return new Date(value);
}
