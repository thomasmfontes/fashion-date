export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(message: string, status = 500, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  adminKey?: string;
  timeoutMs?: number;
}

export async function request<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { adminKey, timeoutMs, headers = {}, signal, ...rest } = options;

  if (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.onLine === false
  ) {
    throw new ApiError(
      "Você está sem conexão com a internet. Verifique seu sinal de Wi-Fi ou rede móvel.",
      0,
    );
  }

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (adminKey) {
    requestHeaders["x-admin-key"] = adminKey;
  }

  const controller = new AbortController();
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  if (timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  // Se o chamador já passou um signal, vincula o cancelamento
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      signal: controller.signal,
    });

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        (typeof data === "object" && data && "error" in data
          ? (data as { error: string }).error
          : null) ||
        `Erro na requisição (${response.status})`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (err: unknown) {
    if (timedOut) {
      throw new ApiError(
        `Tempo limite esgotado (${Math.round((timeoutMs || 8000) / 1000)}s). Verifique a conexão com a internet.`,
        408,
      );
    }
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError("A requisição foi cancelada.", 499);
    }
    const message =
      err instanceof Error ? err.message : "Erro desconhecido de conexão";
    throw new ApiError(message, 500);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
