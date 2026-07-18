import { downloadBlob } from "./canvas-export";
import { isSaveFlowerInput, type SaveFlowerInput } from "./flower-design";

export const flowerFileFormat = "flowerpower-design";
export const flowerFileVersion = 1;

export type FlowerDesignFile = SaveFlowerInput & {
  format: typeof flowerFileFormat;
  version: typeof flowerFileVersion;
};

export function createFlowerDesignFile(
  design: SaveFlowerInput,
): FlowerDesignFile {
  return {
    format: flowerFileFormat,
    version: flowerFileVersion,
    ...design,
  };
}

export function parseFlowerDesignFile(contents: string): FlowerDesignFile {
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!value || typeof value !== "object") {
    throw new Error("The selected file is not a FlowerPower design.");
  }

  const candidate = value as Partial<FlowerDesignFile>;
  if (
    candidate.format !== flowerFileFormat ||
    candidate.version !== flowerFileVersion ||
    !isSaveFlowerInput(candidate)
  ) {
    throw new Error("The selected file is not a supported FlowerPower design.");
  }

  return candidate as FlowerDesignFile;
}

export function downloadFlowerDesign(design: SaveFlowerInput) {
  const file = createFlowerDesignFile(design);
  const filename = `${slugify(design.name) || "flowerpower-study"}.json`;
  downloadBlob(
    new Blob([`${JSON.stringify(file, null, 2)}\n`], {
      type: "application/json",
    }),
    filename,
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
