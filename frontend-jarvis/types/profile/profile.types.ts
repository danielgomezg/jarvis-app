import { Gender } from "@/data/profile/profile-form-fields";

export interface Profile {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  gender: Gender | undefined;
  phone: string | null;
  birthDate: Date | undefined;
  createdAt: string;
  defaultServings: number;
  dietaryPreferences: string[];
  allergenWarnings: string[];
}

export type UpdateProfilePayload = {
  userName: string; // obligatorio
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  defaultServings?: number;
  dietaryPreferences?: string[];
  allergenWarnings?: string[];
};
