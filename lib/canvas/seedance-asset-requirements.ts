export const seedanceAssetRequirementsCopy = {
  zh: [
    "仅通过素材库上传入口进入素材库，画布节点与 AI 生成图不会自动入库。",
    "图片：PNG / JPEG / WebP，短边 ≥ 512px，长边 ≤ 4096px，宽高比 2:5 – 5:2。",
    "视频：MP4 / MOV / WebM，≤ 200MB，需通过 Seedance 自动审核。",
    "审核通过后方可作为 Seedance 角色/参考素材使用。"
  ],
  en: [
    "Only assets uploaded through the library enter the project library.",
    "Images: PNG / JPEG / WebP, shortest side ≥ 512px, longest side ≤ 4096px, aspect ratio 2:5 – 5:2.",
    "Videos: MP4 / MOV / WebM, ≤ 200MB, must pass Seedance auto review.",
    "Approved assets can be used as Seedance character/reference inputs."
  ]
} as const;
