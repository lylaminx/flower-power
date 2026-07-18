import type { QueryResultRow } from "pg";
import { getDatabasePool } from "./database";
import type {
  SaveFlowerInput,
  SavedFlower,
  SavedFlowerSummary,
} from "./flower-design";

type FlowerRow = QueryResultRow & {
  id: string;
  name: string;
  preset: SaveFlowerInput["settings"]["preset"];
  render_mode: SaveFlowerInput["settings"]["renderMode"];
  seed: number;
  created_at: Date;
  updated_at: Date;
};

type FlowerDetailRow = FlowerRow & {
  petal_count: number;
  petal_length: number;
  petal_width: number;
  petal_curl: number;
  petal_waviness: number;
  petal_thickness: number;
  petal_fold: number;
  petal_twist: number;
  petal_ruffle: number;
  petal_notch: number;
  petal_vein_strength: number;
  petal_base_width: number;
  petal_age: number;
  petal_spots: number;
  petal_guide_strength: number;
  bloom: number;
  variation: number;
  petal_color: string;
  petal_tip_color: string;
  center_color: string;
  center_density: number;
  center_size: number;
  center_profile: number;
  center_floret_size: number;
  center_spread: number;
  center_stamen_length: number;
  center_anther_size: number;
  center_stigma_size: number;
  stem_color: string;
  background_color: string;
  stem_curve: number;
  stem_height: number;
  stem_thickness: number;
  stem_taper: number;
  stem_node_count: number;
  stem_hair_density: number;
  leaf_density: number;
  leaf_length: number;
  leaf_width: number;
  leaf_curl: number;
  leaf_serration: number;
  leaf_vein_density: number;
  leaf_droop: number;
  bloom_tilt: number;
  bloom_turn: number;
  light_intensity: number;
  grid_enabled: boolean;
};

const schemaSql = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS flower_varieties (
    slug text PRIMARY KEY,
    display_name text NOT NULL UNIQUE,
    sort_order smallint NOT NULL UNIQUE,
    enabled boolean NOT NULL DEFAULT true
  );
  INSERT INTO flower_varieties (slug, display_name, sort_order) VALUES
    ('daisy', 'Daisy', 1), ('cosmos', 'Cosmos', 2), ('sunset', 'Sunset', 3),
    ('poppy', 'Poppy', 4), ('coneflower', 'Coneflower', 5), ('dahlia', 'Dahlia', 6),
    ('rose', 'Rose', 7), ('sunflower', 'Sunflower', 8), ('peony', 'Peony', 9),
    ('lotus', 'Lotus', 10), ('anemone', 'Anemone', 11), ('zinnia', 'Zinnia', 12),
    ('tulip', 'Tulip', 13), ('iris', 'Iris', 14), ('lily', 'Lily', 15),
    ('orchid', 'Orchid', 16), ('carnation', 'Carnation', 17),
    ('cherry-blossom', 'Cherry Blossom', 18), ('magnolia', 'Magnolia', 19),
    ('camellia', 'Camellia', 20), ('chrysanthemum', 'Chrysanthemum', 21),
    ('daffodil', 'Daffodil', 22), ('hibiscus', 'Hibiscus', 23),
    ('marigold', 'Marigold', 24), ('pansy', 'Pansy', 25),
    ('gardenia', 'Gardenia', 26), ('ranunculus', 'Ranunculus', 27),
    ('gerbera', 'Gerbera', 28), ('bluebell', 'Bluebell', 29), ('protea', 'Protea', 30),
    ('water-lily', 'Water Lily', 31), ('morning-glory', 'Morning Glory', 32),
    ('calla-lily', 'Calla Lily', 33), ('forget-me-not', 'Forget-me-not', 34),
    ('aster', 'Aster', 35), ('clematis', 'Clematis', 36),
    ('hellebore', 'Hellebore', 37), ('crocus', 'Crocus', 38),
    ('amaryllis', 'Amaryllis', 39), ('primrose', 'Primrose', 40),
    ('plumeria', 'Plumeria', 41), ('poinsettia', 'Poinsettia', 42)
  ON CONFLICT (slug) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    sort_order = EXCLUDED.sort_order,
    enabled = true;
  CREATE TABLE IF NOT EXISTS flower_designs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
    preset text NOT NULL,
    render_mode text NOT NULL CHECK (render_mode IN ('color', 'line', 'photo')),
    seed integer NOT NULL CHECK (seed >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS flower_petals (
    flower_id uuid PRIMARY KEY REFERENCES flower_designs(id) ON DELETE CASCADE,
    petal_count smallint NOT NULL CHECK (petal_count BETWEEN 1 AND 100),
    petal_length real NOT NULL CHECK (petal_length > 0),
    petal_width real NOT NULL CHECK (petal_width > 0),
    petal_curl real NOT NULL CHECK (petal_curl BETWEEN 0 AND 1),
    petal_waviness real NOT NULL DEFAULT 0.18 CHECK (petal_waviness BETWEEN 0 AND 1),
    bloom real NOT NULL CHECK (bloom BETWEEN 0 AND 1),
    variation real NOT NULL CHECK (variation BETWEEN 0 AND 1),
    petal_color varchar(7) NOT NULL,
    petal_tip_color varchar(7) NOT NULL
  );
  CREATE TABLE IF NOT EXISTS flower_scenes (
    flower_id uuid PRIMARY KEY REFERENCES flower_designs(id) ON DELETE CASCADE,
    center_color varchar(7) NOT NULL,
    stem_color varchar(7) NOT NULL,
    background_color varchar(7) NOT NULL,
    stem_curve real NOT NULL CHECK (stem_curve >= 0),
    light_intensity real NOT NULL CHECK (light_intensity >= 0),
    grid_enabled boolean NOT NULL DEFAULT false
  );
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS center_density real NOT NULL DEFAULT 1
    CHECK (center_density BETWEEN 0.25 AND 2);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_waviness real NOT NULL DEFAULT 0.18
    CHECK (petal_waviness BETWEEN 0 AND 1);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS stem_height real NOT NULL DEFAULT 1
    CHECK (stem_height BETWEEN 0.65 AND 1.35);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS stem_thickness real NOT NULL DEFAULT 1
    CHECK (stem_thickness BETWEEN 0.5 AND 1.8);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS stem_taper real NOT NULL DEFAULT 0.38
    CHECK (stem_taper BETWEEN 0 AND 0.7);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS stem_node_count smallint NOT NULL DEFAULT 2
    CHECK (stem_node_count BETWEEN 0 AND 8);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS stem_hair_density real NOT NULL DEFAULT 1
    CHECK (stem_hair_density BETWEEN 0 AND 2);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS leaf_density real NOT NULL DEFAULT 1
    CHECK (leaf_density BETWEEN 0 AND 2);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS leaf_length real NOT NULL DEFAULT 1
    CHECK (leaf_length BETWEEN 0.5 AND 1.6);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS leaf_width real NOT NULL DEFAULT 1
    CHECK (leaf_width BETWEEN 0.5 AND 1.6);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS leaf_curl real NOT NULL DEFAULT 0.35
    CHECK (leaf_curl BETWEEN 0 AND 1);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS leaf_serration real NOT NULL DEFAULT 1
    CHECK (leaf_serration BETWEEN 0 AND 2);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS leaf_vein_density real NOT NULL DEFAULT 1
    CHECK (leaf_vein_density BETWEEN 0.25 AND 2);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_thickness real NOT NULL DEFAULT 1
    CHECK (petal_thickness BETWEEN 0.25 AND 2);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_fold real NOT NULL DEFAULT 0.5
    CHECK (petal_fold BETWEEN 0 AND 1);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_twist real NOT NULL DEFAULT 0.5
    CHECK (petal_twist BETWEEN -1 AND 1);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_ruffle real NOT NULL DEFAULT 1
    CHECK (petal_ruffle BETWEEN 0 AND 2);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_notch real NOT NULL DEFAULT 1
    CHECK (petal_notch BETWEEN 0 AND 2);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_vein_strength real NOT NULL DEFAULT 1
    CHECK (petal_vein_strength BETWEEN 0 AND 2);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_base_width real NOT NULL DEFAULT 1
    CHECK (petal_base_width BETWEEN 0.5 AND 1.8);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS center_size real NOT NULL DEFAULT 1
    CHECK (center_size BETWEEN 0.5 AND 1.7);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS center_profile real NOT NULL DEFAULT 1
    CHECK (center_profile BETWEEN 0.4 AND 1.8);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS center_floret_size real NOT NULL DEFAULT 1
    CHECK (center_floret_size BETWEEN 0.5 AND 1.8);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS center_spread real NOT NULL DEFAULT 1
    CHECK (center_spread BETWEEN 0.5 AND 1.35);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS center_stamen_length real NOT NULL DEFAULT 1
    CHECK (center_stamen_length BETWEEN 0.4 AND 2);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS center_anther_size real NOT NULL DEFAULT 1
    CHECK (center_anther_size BETWEEN 0.4 AND 2);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS center_stigma_size real NOT NULL DEFAULT 1
    CHECK (center_stigma_size BETWEEN 0.4 AND 2);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_age real NOT NULL DEFAULT 0
    CHECK (petal_age BETWEEN 0 AND 1);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_spots real NOT NULL DEFAULT 0
    CHECK (petal_spots BETWEEN 0 AND 1);
  ALTER TABLE flower_petals ADD COLUMN IF NOT EXISTS petal_guide_strength real NOT NULL DEFAULT 0.12
    CHECK (petal_guide_strength BETWEEN 0 AND 1);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS leaf_droop real NOT NULL DEFAULT 0.25
    CHECK (leaf_droop BETWEEN 0 AND 1);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS bloom_tilt real NOT NULL DEFAULT 0
    CHECK (bloom_tilt BETWEEN -0.6 AND 0.6);
  ALTER TABLE flower_scenes ADD COLUMN IF NOT EXISTS bloom_turn real NOT NULL DEFAULT 0
    CHECK (bloom_turn BETWEEN -3.15 AND 3.15);
  CREATE INDEX IF NOT EXISTS flower_designs_created_at_idx ON flower_designs (created_at DESC);
  ALTER TABLE flower_designs DROP CONSTRAINT IF EXISTS flower_designs_preset_check;
  ALTER TABLE flower_designs ADD CONSTRAINT flower_designs_preset_check
    CHECK (preset IN (
      'Daisy', 'Cosmos', 'Sunset', 'Poppy', 'Coneflower', 'Dahlia',
      'Rose', 'Sunflower', 'Peony', 'Lotus', 'Anemone', 'Zinnia',
      'Tulip', 'Iris', 'Lily', 'Orchid', 'Carnation', 'Cherry Blossom',
      'Magnolia', 'Camellia', 'Chrysanthemum', 'Daffodil', 'Hibiscus', 'Marigold',
      'Pansy', 'Gardenia', 'Ranunculus', 'Gerbera', 'Bluebell', 'Protea',
      'Water Lily', 'Morning Glory', 'Calla Lily', 'Forget-me-not', 'Aster', 'Clematis',
      'Hellebore', 'Crocus', 'Amaryllis', 'Primrose', 'Plumeria', 'Poinsettia'
    ));
  ALTER TABLE flower_designs DROP CONSTRAINT IF EXISTS flower_designs_render_mode_check;
  ALTER TABLE flower_designs ADD CONSTRAINT flower_designs_render_mode_check
    CHECK (render_mode IN ('color', 'line', 'photo'));
`;

let schemaReady: Promise<void> | undefined;

async function ensureFlowerSchema() {
  schemaReady ??= getDatabasePool()
    .query(schemaSql)
    .then(() => undefined)
    .catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  return schemaReady;
}

export async function saveFlower(
  input: SaveFlowerInput,
): Promise<SavedFlowerSummary> {
  await ensureFlowerSchema();
  const { settings } = input;
  const result = await getDatabasePool().query<FlowerRow>(
    `WITH design AS (
      INSERT INTO flower_designs (name, preset, render_mode, seed)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    ), petals AS (
      INSERT INTO flower_petals (
        flower_id, petal_count, petal_length, petal_width, petal_curl,
        bloom, variation, petal_color, petal_tip_color, petal_waviness,
        petal_thickness, petal_fold, petal_twist, petal_ruffle,
        petal_notch, petal_vein_strength, petal_base_width,
        petal_age, petal_spots, petal_guide_strength
      )
      SELECT id, $5, $6, $7, $8, $9, $10, $11, $12, $20,
        $32, $33, $34, $35, $36, $37, $38, $46, $47, $48 FROM design
    ), scene AS (
      INSERT INTO flower_scenes (
        flower_id, center_color, stem_color, background_color,
        stem_curve, light_intensity, grid_enabled, center_density,
        stem_height, stem_thickness, stem_taper, stem_node_count, stem_hair_density,
        leaf_density, leaf_length, leaf_width, leaf_curl, leaf_serration, leaf_vein_density,
        center_size, center_profile, center_floret_size, center_spread,
        center_stamen_length, center_anther_size, center_stigma_size,
        leaf_droop, bloom_tilt, bloom_turn
      )
      SELECT id, $13, $14, $15, $16, $17, $18, $19,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
        $39, $40, $41, $42, $43, $44, $45, $49, $50, $51 FROM design
    )
    SELECT * FROM design`,
    [
      input.name.trim(),
      settings.preset,
      settings.renderMode,
      settings.seed,
      settings.petalCount,
      settings.petalLength,
      settings.petalWidth,
      settings.petalCurl,
      settings.bloom,
      settings.variation,
      settings.petalColor,
      settings.petalTipColor,
      settings.centerColor,
      settings.stemColor,
      settings.backgroundColor,
      settings.stemCurve,
      settings.lightIntensity,
      settings.grid,
      settings.centerDensity,
      settings.petalWaviness,
      settings.stemHeight,
      settings.stemThickness,
      settings.stemTaper,
      settings.stemNodeCount,
      settings.stemHairDensity,
      settings.leafDensity,
      settings.leafLength,
      settings.leafWidth,
      settings.leafCurl,
      settings.leafSerration,
      settings.leafVeinDensity,
      settings.petalThickness,
      settings.petalFold,
      settings.petalTwist,
      settings.petalRuffle,
      settings.petalNotch,
      settings.petalVeinStrength,
      settings.petalBaseWidth,
      settings.centerSize,
      settings.centerProfile,
      settings.centerFloretSize,
      settings.centerSpread,
      settings.centerStamenLength,
      settings.centerAntherSize,
      settings.centerStigmaSize,
      settings.petalAge,
      settings.petalSpots,
      settings.petalGuideStrength,
      settings.leafDroop,
      settings.bloomTilt,
      settings.bloomTurn,
    ],
  );
  return toSummary(result.rows[0]);
}

export async function listFlowers(): Promise<SavedFlowerSummary[]> {
  await ensureFlowerSchema();
  const result = await getDatabasePool().query<FlowerRow>(
    `SELECT id, name, preset, render_mode, seed, created_at, updated_at
     FROM flower_designs ORDER BY created_at DESC LIMIT 100`,
  );
  return result.rows.map(toSummary);
}

export async function getFlower(id: string): Promise<SavedFlower | null> {
  await ensureFlowerSchema();
  const result = await getDatabasePool().query<FlowerDetailRow>(
    `SELECT
       d.id, d.name, d.preset, d.render_mode, d.seed, d.created_at, d.updated_at,
       p.petal_count, p.petal_length, p.petal_width, p.petal_curl, p.petal_waviness,
       p.petal_thickness, p.petal_fold, p.petal_twist, p.petal_ruffle,
       p.petal_notch, p.petal_vein_strength, p.petal_base_width,
       p.petal_age, p.petal_spots, p.petal_guide_strength,
       p.bloom, p.variation, p.petal_color, p.petal_tip_color,
       s.center_color, s.stem_color, s.background_color, s.stem_curve,
       s.light_intensity, s.grid_enabled, s.center_density, s.stem_height,
       s.stem_thickness, s.stem_taper, s.stem_node_count, s.stem_hair_density,
       s.leaf_density, s.leaf_length, s.leaf_width, s.leaf_curl,
       s.leaf_serration, s.leaf_vein_density, s.center_size, s.center_profile,
       s.center_floret_size, s.center_spread, s.center_stamen_length,
       s.center_anther_size, s.center_stigma_size, s.leaf_droop,
       s.bloom_tilt, s.bloom_turn
     FROM flower_designs d
     JOIN flower_petals p ON p.flower_id = d.id
     JOIN flower_scenes s ON s.flower_id = d.id
     WHERE d.id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...toSummary(row),
    settings: {
      renderMode: row.render_mode,
      preset: row.preset,
      seed: row.seed,
      petalCount: row.petal_count,
      petalLength: row.petal_length,
      petalWidth: row.petal_width,
      petalCurl: row.petal_curl,
      petalWaviness: row.petal_waviness,
      petalThickness: row.petal_thickness,
      petalFold: row.petal_fold,
      petalTwist: row.petal_twist,
      petalRuffle: row.petal_ruffle,
      petalNotch: row.petal_notch,
      petalVeinStrength: row.petal_vein_strength,
      petalBaseWidth: row.petal_base_width,
      petalAge: row.petal_age,
      petalSpots: row.petal_spots,
      petalGuideStrength: row.petal_guide_strength,
      bloom: row.bloom,
      variation: row.variation,
      petalColor: row.petal_color,
      petalTipColor: row.petal_tip_color,
      centerColor: row.center_color,
      stemColor: row.stem_color,
      backgroundColor: row.background_color,
      stemCurve: row.stem_curve,
      stemHeight: row.stem_height,
      stemThickness: row.stem_thickness,
      stemTaper: row.stem_taper,
      stemNodeCount: row.stem_node_count,
      stemHairDensity: row.stem_hair_density,
      leafDensity: row.leaf_density,
      leafLength: row.leaf_length,
      leafWidth: row.leaf_width,
      leafCurl: row.leaf_curl,
      leafSerration: row.leaf_serration,
      leafVeinDensity: row.leaf_vein_density,
      leafDroop: row.leaf_droop,
      bloomTilt: row.bloom_tilt,
      bloomTurn: row.bloom_turn,
      lightIntensity: row.light_intensity,
      grid: row.grid_enabled,
      centerDensity: row.center_density,
      centerSize: row.center_size,
      centerProfile: row.center_profile,
      centerFloretSize: row.center_floret_size,
      centerSpread: row.center_spread,
      centerStamenLength: row.center_stamen_length,
      centerAntherSize: row.center_anther_size,
      centerStigmaSize: row.center_stigma_size,
    },
  };
}

function toSummary(row: FlowerRow): SavedFlowerSummary {
  return {
    id: row.id,
    name: row.name,
    preset: row.preset,
    renderMode: row.render_mode,
    seed: row.seed,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
