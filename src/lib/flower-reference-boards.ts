import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  heroFlowerProfiles,
  type HeroFlowerPreset,
} from "./hero-flower-profiles";
import { visualTestScenarios } from "./visual-test-scenarios";

type WikimediaMetadata = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{
          url?: string;
          descriptionurl?: string;
          extmetadata?: Record<string, { value?: string } | undefined>;
        }>;
      }
    >;
  };
};

export type ReferenceImage = {
  species: HeroFlowerPreset;
  view: string;
  filename: string;
  title: string;
  creator: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  takenAt?: string;
  imageUrl: string;
};

export type ReferenceBoard = {
  species: HeroFlowerPreset;
  label: string;
  scenarioId: string | undefined;
  traits: readonly string[];
  referenceChecks: readonly string[];
  images: ReferenceImage[];
};

const referenceRoot = path.join(process.cwd(), "references", "flowers");
const heroSpeciesOrder = Object.keys(heroFlowerProfiles) as HeroFlowerPreset[];

export async function getReferenceBoards() {
  const boards = await Promise.all(heroSpeciesOrder.map(loadReferenceBoard));
  return boards.filter(
    (board): board is ReferenceBoard => board.images.length > 0,
  );
}

export function isHeroFlowerPreset(
  species: string,
): species is HeroFlowerPreset {
  return species in heroFlowerProfiles;
}

export async function getReferenceBoard(species: HeroFlowerPreset) {
  return loadReferenceBoard(species);
}

export async function loadReferenceBoard(species: HeroFlowerPreset) {
  const folder = species.toLowerCase();
  const speciesDir = path.join(referenceRoot, folder);
  const entries = await readdir(speciesDir, { withFileTypes: true }).catch(
    () => [],
  );
  const images = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".jpg"))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) => loadReferenceImage(species, speciesDir, entry.name)),
  );

  return {
    species,
    label: heroFlowerProfiles[species].label,
    scenarioId: visualTestScenarios.find(
      (scenario) => scenario.species === species,
    )?.id,
    traits: heroFlowerProfiles[species].traits,
    referenceChecks: heroFlowerProfiles[species].referenceChecks,
    images,
  };
}

async function loadReferenceImage(
  species: HeroFlowerPreset,
  speciesDir: string,
  filename: string,
): Promise<ReferenceImage> {
  const baseName = filename.replace(/\.[^.]+$/, "");
  const metadataPath = path.join(speciesDir, `${baseName}.metadata.json`);
  const metadata = await readMetadata(metadataPath);
  const imageUrl = `/api/reference-flowers/${species.toLowerCase()}/${encodeURIComponent(filename)}`;
  return {
    species,
    view: baseName,
    filename,
    title: metadata.title ?? prettifyFileName(baseName),
    creator: metadata.creator ?? "Unknown creator",
    sourceUrl: metadata.sourceUrl ?? "",
    license: metadata.license ?? "Unspecified",
    licenseUrl: metadata.licenseUrl ?? "",
    takenAt: metadata.takenAt,
    imageUrl,
  };
}

async function readMetadata(metadataPath: string) {
  const text = await readFile(metadataPath, "utf8").catch(() => "");
  if (!text) return {};
  let parsed: WikimediaMetadata;
  try {
    parsed = JSON.parse(text) as WikimediaMetadata;
  } catch {
    return {};
  }
  const page = Object.values(parsed.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  const extmetadata = info?.extmetadata ?? {};
  const title = page?.title?.replace(/^File:/, "");
  const creator =
    normalizeMetadataValue(extmetadata.Artist?.value) ??
    normalizeMetadataValue(extmetadata.Credit?.value) ??
    "";
  const sourceUrl = info?.descriptionurl ?? "";
  const license = normalizeMetadataValue(extmetadata.LicenseShortName?.value);
  const licenseUrl = normalizeMetadataValue(extmetadata.LicenseUrl?.value);
  const takenAt = normalizeMetadataValue(
    extmetadata.DateTimeOriginal?.value ?? extmetadata.DateTime?.value,
  );

  return { title, creator, sourceUrl, license, licenseUrl, takenAt };
}

function normalizeMetadataValue(value?: string) {
  if (!value) return undefined;
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function prettifyFileName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
