"use client";

import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AvatarCropModal } from "@/components/studioos/image-crop/avatar-crop-modal";
import { ImageCropModal } from "@/components/studioos/image-crop/image-crop-modal";
import { PROFILE_AVATAR_ASPECT } from "@/lib/studioos/image-crop-client";
import type { ProfileImageOutputPreset } from "@/lib/studioos/profile-image-output";
import type { Locale } from "@/lib/i18n";

type UseProfileImagePickerOptions = {
  locale: Locale;
  aspectRatio: number;
  fileNamePrefix?: string;
  outputPreset?: ProfileImageOutputPreset;
  onCropped: (file: File) => void | Promise<void>;
};

export function useProfileImagePicker({
  locale,
  aspectRatio,
  fileNamePrefix,
  outputPreset,
  onCropped
}: UseProfileImagePickerOptions) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const requestCrop = useCallback((file: File) => {
    setCropFile(file);
  }, []);

  const onInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      setCropFile(file);
    }
  }, []);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleConfirm = useCallback(
    (file: File) => {
      setCropFile(null);
      void onCropped(file);
    },
    [onCropped]
  );

  const handleCancel = useCallback(() => {
    setCropFile(null);
  }, []);

  const cropModal = useMemo(
    () =>
      cropFile ? (
        aspectRatio === PROFILE_AVATAR_ASPECT ? (
          <AvatarCropModal
            file={cropFile}
            locale={locale}
            fileNamePrefix={fileNamePrefix}
            outputPreset={outputPreset ?? "avatar"}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        ) : (
          <ImageCropModal
            file={cropFile}
            aspectRatio={aspectRatio}
            locale={locale}
            fileNamePrefix={fileNamePrefix}
            outputPreset={outputPreset ?? "cover"}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )
      ) : null,
    [aspectRatio, cropFile, fileNamePrefix, handleCancel, handleConfirm, locale, outputPreset]
  );

  return {
    cropModal,
    inputRef,
    onInputChange,
    openPicker,
    requestCrop
  };
}
