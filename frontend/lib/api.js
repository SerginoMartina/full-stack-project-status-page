const MAX_GET_ATTEMPTS = 12;
const RETRY_DELAY_MS = 5000;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function fetchApiJson(path, options = {}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const method = (options.method || "GET").toUpperCase();
  const canRetry = method === "GET";
  const maxAttempts = canRetry ? MAX_GET_ATTEMPTS : 1;
  let response;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      response = await fetch(`${apiUrl}${path}`, options);
    } catch (error) {
      if (!canRetry || attempt === maxAttempts) throw error;
      await wait(RETRY_DELAY_MS);
      continue;
    }

    if (canRetry && response.status >= 500 && attempt < maxAttempts) {
      await wait(RETRY_DELAY_MS);
      continue;
    }
    break;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Backend returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}.`);
  }
  return data;
}
