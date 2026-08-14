export interface UserPayload {
  authId: string;
  email: string;
  profileId?: string; // Es opcional debido al operador '?.' que usaste en tu Prisma query
}
