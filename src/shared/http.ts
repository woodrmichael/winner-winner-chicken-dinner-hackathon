export const workspaceApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

export async function withResponse<T>(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  read: (response: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await read(await fetch(url, { ...options, signal: controller.signal }));
  } finally {
    clearTimeout(timeout);
  }
}
