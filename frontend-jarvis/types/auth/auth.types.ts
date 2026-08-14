export interface RegisterDto {
  email: string;
  password: string;
  confirmPassword: string;
  userName: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  email: string;
  userName: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  accessToken: string;
}

// Confirmation DTO for resending verification email
export interface ConfirmationDto {
  email: string;
}

export interface ConfirmationResponse {
  message: string; //mensaje generico de confirmación, por ejemplo: "Correo de verificación reenviado"
}
