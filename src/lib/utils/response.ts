export function jsonResponse(
  data: any,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

export function errorResponse(
  message: string,
  status = 400,
  extra: Record<string, any> = {}
): Response {
  return jsonResponse(
    {
      success: false,
      error: message,
      ...extra
    },
    status
  );
}

export function successResponse(
  data: any = {},
  status = 200,
  extra: Record<string, any> = {}
): Response {
  return jsonResponse(
    {
      success: true,
      data,
      ...extra
    },
    status
  );
}
