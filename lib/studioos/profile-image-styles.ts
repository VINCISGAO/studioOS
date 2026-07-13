export type ProfileImageFit = "photo" | "logo" | "mark";

/** Uploaded avatars / logos on profile frames — fill the container edge to edge. */
export function profileFrameImageClassName() {
  return "object-cover object-center";
}

/** Small brand mark in portal nav circles — keep logo centered with breathing room. */
export function profileLogoMarkClassName() {
  return "object-contain object-center p-[10%]";
}

/** @deprecated alias */
export function profilePhotoImageClassName() {
  return profileFrameImageClassName();
}

/** @deprecated alias */
export function profileLogoImageClassName() {
  return profileFrameImageClassName();
}

export function profileImageClassName(fit: ProfileImageFit = "photo") {
  return fit === "mark" ? profileLogoMarkClassName() : profileFrameImageClassName();
}
