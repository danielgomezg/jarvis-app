export interface UserSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  isRevoked: boolean;
  createdAt: Date;
  revokedAt: Date | null;
  deviceInfo?: string | null; // Puedes agregar información del dispositivo o IP si lo deseas
  ipAddress?: string | null;
}
