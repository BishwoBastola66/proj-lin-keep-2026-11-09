/**
 * Avatar helper utility
 * Returns uploaded avatarUrl if present, otherwise returns friendly 3D waving avatar
 * based on gender:
 * - female -> /avatars/avatar-girl.jpg (Hi Girl avatar)
 * - male / default -> /avatars/avatar-boy.jpg (Hi Boy avatar)
 */
export function getUserAvatar(
  avatarUrl?: string | null,
  gender?: string | null
): string {
  if (
    avatarUrl &&
    typeof avatarUrl === "string" &&
    avatarUrl.trim() &&
    avatarUrl.trim() !== "null" &&
    avatarUrl.trim() !== "undefined"
  ) {
    return avatarUrl.trim();
  }

  if (gender && typeof gender === "string" && gender.toLowerCase() === "female") {
    return "/avatars/avatar-girl.jpg";
  }

  return "/avatars/avatar-boy.jpg";
}
