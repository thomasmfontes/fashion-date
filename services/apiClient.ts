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
}

export async function request<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { adminKey, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (adminKey) {
    requestHeaders["x-admin-key"] = adminKey;
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
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
}
