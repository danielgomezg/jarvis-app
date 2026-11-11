import { apiPrivate } from "@/lib/api";
import { Profile, UpdateProfilePayload } from "@/types/profile/profile.types";

export const ProfileService = {
  me: () => apiPrivate.get<Profile>("/profile/me", {}),
  updateProfile: (data: UpdateProfilePayload) =>
    apiPrivate.patch<Profile>("/profile/me", data),
};

//updateDietaryPreferences(prefs) // PATCH /api/v1/profile/me/dietary
//updateAllergenWarnings(warns)   // PATCH /api/v1/profile/me/allergens
