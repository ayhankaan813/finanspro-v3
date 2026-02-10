const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<LoginResponse> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Giriş başarısız');
  }

  return result.data!;
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const result: ApiResponse<{ accessToken: string }> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Token yenileme başarısız');
  }

  return result.data!.accessToken;
}

export async function logout(accessToken: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getCurrentUser(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result: ApiResponse<{ id: string; email: string; name: string; role: string }> =
    await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Kullanıcı bilgisi alınamadı');
  }

  return result.data!;
}
