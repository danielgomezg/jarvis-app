export interface LoginOAuth {
  userId: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  avatar?: string; //puede cambiar
  provider: string;
  provider_account_id: string;
}
