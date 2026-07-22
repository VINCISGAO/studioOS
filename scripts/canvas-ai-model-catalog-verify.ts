/**
 * Canvas AI model catalog verification
 * Run: npm run canvas:ai-models:verify
 */
import { PrismaClient } from "@prisma/client";
import { aiModelCatalogService } from "../features/canvas/ai-model-catalog.service";
import { aiModelGenerationGuard } from "../features/canvas/ai-model-generation.guard";
import { clampVideoSettings } from "../lib/canvas/ai-model-settings";

const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

function report(checks: Check[]) {
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? `: ${check.detail}` : ""}`);
  }
  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`${failed.length} canvas catalog check(s) failed`);
  }
}

async function main() {
  const checks: Check[] = [];

  if (!process.env.DATABASE_URL) {
    checks.push({ name: "canvas.catalog.skip", ok: true, detail: "DATABASE_URL not configured" });
    report(checks);
    return;
  }

  const catalog = await aiModelCatalogService.listPublicCatalog();
  checks.push({
    name: "canvas.catalog.public_models",
    ok: catalog.models.length > 0,
    detail: `${catalog.models.length} models`
  });

  const hasGroupedCategories =
    catalog.grouped.VIDEO.length > 0 &&
    catalog.grouped.IMAGE.length > 0 &&
    catalog.grouped.MUSIC.length > 0;
  checks.push({
    name: "canvas.catalog.grouped_categories",
    ok: hasGroupedCategories,
    detail: `video=${catalog.grouped.VIDEO.length}, image=${catalog.grouped.IMAGE.length}, music=${catalog.grouped.MUSIC.length}`
  });

  for (const model of catalog.models) {
    checks.push({
      name: `canvas.catalog.capabilities.${model.id}`,
      ok: model.capabilities.supportedModes.length > 0 || model.category === "IMAGE",
      detail: model.category
    });
    checks.push({
      name: `canvas.catalog.no_provider.${model.id}`,
      ok: !("provider" in model),
      detail: "provider hidden from public payload"
    });
  }

  const sampleVideo = catalog.grouped.VIDEO[0];
  if (sampleVideo) {
    const clamped = clampVideoSettings(
      {
        aspectRatio: "21:9",
        duration: 99,
        quality: "4k",
        audio: true,
        webSearch: false,
        cameraMovements: []
      },
      sampleVideo.capabilities
    );
    checks.push({
      name: "canvas.settings.clamp_video",
      ok:
        sampleVideo.capabilities.supportedAspectRatios.includes(clamped.aspectRatio) ||
        clamped.aspectRatio === sampleVideo.capabilities.supportedAspectRatios[0],
      detail: `${clamped.aspectRatio}/${clamped.duration}/${clamped.quality}`
    });

    await aiModelGenerationGuard.resolveForGeneration({
      type: "VIDEO",
      model: sampleVideo.id,
      parameters: {
        aspectRatio: clamped.aspectRatio,
        duration: clamped.duration,
        quality: clamped.quality,
        outputs: 1
      }
    });
    checks.push({ name: "canvas.guard.video_resolve", ok: true, detail: sampleVideo.id });
  }

  const disabledModel = await prisma.aiModel.findFirst({
    where: { enabled: false, deletedAt: null },
    select: { internalModelId: true, generationType: true }
  });
  if (disabledModel) {
    let rejected = false;
    try {
      await aiModelGenerationGuard.resolveForGeneration({
        type: disabledModel.generationType,
        model: disabledModel.internalModelId,
        parameters: { duration: 5, quality: "720p", outputs: 1 }
      });
    } catch (error) {
      rejected = error instanceof Error && error.message.includes("unavailable");
    }
    checks.push({
      name: "canvas.guard.disabled_model_rejected",
      ok: rejected,
      detail: disabledModel.internalModelId
    });
  } else {
    checks.push({
      name: "canvas.guard.disabled_model_rejected",
      ok: true,
      detail: "no disabled model row to test"
    });
  }

  const staleModelId = "__stale-client-model__";
  let staleRejected = false;
  try {
    await aiModelGenerationGuard.resolveForGeneration({
      type: "VIDEO",
      model: staleModelId,
      parameters: { duration: 5, quality: "720p", outputs: 1 }
    });
  } catch (error) {
    staleRejected = error instanceof Error && error.message.includes("not registered");
  }
  checks.push({
    name: "canvas.guard.stale_client_selection",
    ok: staleRejected,
    detail: staleModelId
  });

  if (sampleVideo) {
    let invalidParamsRejected = false;
    try {
      await aiModelGenerationGuard.resolveForGeneration({
        type: "VIDEO",
        model: sampleVideo.id,
        parameters: {
          aspectRatio: "__invalid_ratio__",
          duration: sampleVideo.capabilities.supportedDurations[0] ?? 5,
          quality: sampleVideo.capabilities.supportedResolutions[0] ?? "720p",
          outputs: 1
        }
      });
    } catch (error) {
      invalidParamsRejected =
        error instanceof Error && error.message.includes("Aspect ratio is not supported");
    }
    checks.push({
      name: "canvas.guard.invalid_parameters",
      ok: invalidParamsRejected,
      detail: sampleVideo.id
    });
  }

  const modelWithoutPricing = await prisma.aiModel.findFirst({
    where: {
      enabled: true,
      publiclyAvailable: true,
      deletedAt: null,
      pricingRules: { none: { status: "PUBLISHED", enabled: true } }
    },
    select: { internalModelId: true, generationType: true }
  });
  checks.push({
    name: "canvas.catalog.public_models_have_pricing",
    ok: !modelWithoutPricing,
    detail: modelWithoutPricing?.internalModelId ?? "all public models priced"
  });

  report(checks);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
