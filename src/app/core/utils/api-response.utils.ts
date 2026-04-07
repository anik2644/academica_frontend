export type UnknownRecord = Record<string, unknown>;

export function extractList<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (!isRecord(response)) {
    return [];
  }

  if (Array.isArray(response['content'])) {
    return response['content'] as T[];
  }

  if (Array.isArray(response['data'])) {
    return response['data'] as T[];
  }

  if (isRecord(response['data']) && Array.isArray(response['data']['content'])) {
    return response['data']['content'] as T[];
  }

  return [];
}

export function extractItem<T>(response: unknown): T | null {
  if (!isRecord(response)) {
    return (response as T) ?? null;
  }

  if (isRecord(response['data'])) {
    return response['data'] as T;
  }

  return response as T;
}

export function getErrorMessage(error: unknown, fallback = 'Unable to load data.'): string {
  if (!isRecord(error)) {
    return fallback;
  }

  const nestedError = error['error'];

  if (isRecord(nestedError) && typeof nestedError['message'] === 'string') {
    return nestedError['message'];
  }

  if (typeof error['message'] === 'string') {
    return error['message'];
  }

  return fallback;
}

export function readString(source: unknown, ...keys: string[]): string {
  for (const key of keys) {
    const value = readValue(source, key);
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '';
}

export function readBoolean(source: unknown, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = readValue(source, key);
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return false;
}

export function readNumber(source: unknown, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = readValue(source, key);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

export function readRecord(source: unknown, key: string): UnknownRecord | null {
  const value = readValue(source, key);
  return isRecord(value) ? value : null;
}

function readValue(source: unknown, key: string): unknown {
  if (!isRecord(source)) {
    return undefined;
  }

  return source[key];
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}
