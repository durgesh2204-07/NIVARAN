export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassValue[]
  | Record<string, boolean | undefined | null>;

function flattenClassValues(input: ClassValue): string[] {
  if (!input) return [];
  if (typeof input === 'string' || typeof input === 'number') {
    return [String(input)];
  }
  if (Array.isArray(input)) {
    return input.flatMap(flattenClassValues);
  }
  if (typeof input === 'object') {
    return Object.entries(input)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key);
  }
  return [];
}

export function cn(...inputs: ClassValue[]): string {
  return inputs.flatMap(flattenClassValues).join(' ').trim();
}
