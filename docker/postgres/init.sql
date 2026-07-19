CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_health (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  service_name text NOT NULL UNIQUE,
  initialized_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_health (service_name)
VALUES ('flower-power')
ON CONFLICT (service_name) DO NOTHING;

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
  ('plumeria', 'Plumeria', 41), ('poinsettia', 'Poinsettia', 42),
  ('lisianthus', 'Lisianthus', 43), ('sweet-pea', 'Sweet Pea', 44),
  ('freesia', 'Freesia', 45), ('azalea', 'Azalea', 46),
  ('passionflower', 'Passionflower', 47), ('dogwood', 'Dogwood', 48),
  ('rhododendron', 'Rhododendron', 49), ('begonia', 'Begonia', 50),
  ('petunia', 'Petunia', 51), ('nasturtium', 'Nasturtium', 52),
  ('gladiolus', 'Gladiolus', 53), ('apple-blossom', 'Apple Blossom', 54)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  sort_order = EXCLUDED.sort_order,
  enabled = true;

CREATE TABLE IF NOT EXISTS flower_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  preset text NOT NULL CHECK (preset IN (
    'Daisy', 'Cosmos', 'Sunset', 'Poppy', 'Coneflower', 'Dahlia',
    'Rose', 'Sunflower', 'Peony', 'Lotus', 'Anemone', 'Zinnia',
    'Tulip', 'Iris', 'Lily', 'Orchid', 'Carnation', 'Cherry Blossom',
    'Magnolia', 'Camellia', 'Chrysanthemum', 'Daffodil', 'Hibiscus', 'Marigold',
    'Pansy', 'Gardenia', 'Ranunculus', 'Gerbera', 'Bluebell', 'Protea',
    'Water Lily', 'Morning Glory', 'Calla Lily', 'Forget-me-not', 'Aster', 'Clematis',
    'Hellebore', 'Crocus', 'Amaryllis', 'Primrose', 'Plumeria', 'Poinsettia',
    'Lisianthus', 'Sweet Pea', 'Freesia', 'Azalea', 'Passionflower', 'Dogwood',
    'Rhododendron', 'Begonia', 'Petunia', 'Nasturtium', 'Gladiolus', 'Apple Blossom'
  )),
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
  petal_thickness real NOT NULL DEFAULT 1 CHECK (petal_thickness BETWEEN 0.25 AND 2),
  petal_fold real NOT NULL DEFAULT 0.5 CHECK (petal_fold BETWEEN 0 AND 1),
  petal_twist real NOT NULL DEFAULT 0.5 CHECK (petal_twist BETWEEN -1 AND 1),
  petal_ruffle real NOT NULL DEFAULT 1 CHECK (petal_ruffle BETWEEN 0 AND 2),
  petal_notch real NOT NULL DEFAULT 1 CHECK (petal_notch BETWEEN 0 AND 2),
  petal_vein_strength real NOT NULL DEFAULT 1 CHECK (petal_vein_strength BETWEEN 0 AND 2),
  petal_base_width real NOT NULL DEFAULT 1 CHECK (petal_base_width BETWEEN 0.5 AND 1.8),
  petal_age real NOT NULL DEFAULT 0 CHECK (petal_age BETWEEN 0 AND 1),
  petal_spots real NOT NULL DEFAULT 0 CHECK (petal_spots BETWEEN 0 AND 1),
  petal_guide_strength real NOT NULL DEFAULT 0.12 CHECK (petal_guide_strength BETWEEN 0 AND 1),
  petal_asymmetry real NOT NULL DEFAULT 0.08 CHECK (petal_asymmetry BETWEEN 0 AND 0.4),
  petal_translucency real NOT NULL DEFAULT 0.18 CHECK (petal_translucency BETWEEN 0 AND 1),
  petal_edge_wear real NOT NULL DEFAULT 0.05 CHECK (petal_edge_wear BETWEEN 0 AND 1),
  petal_sheen real NOT NULL DEFAULT 0.2 CHECK (petal_sheen BETWEEN 0 AND 1),
  bloom real NOT NULL CHECK (bloom BETWEEN 0 AND 1),
  variation real NOT NULL CHECK (variation BETWEEN 0 AND 1),
  petal_color varchar(7) NOT NULL,
  petal_tip_color varchar(7) NOT NULL
);

CREATE TABLE IF NOT EXISTS flower_scenes (
  flower_id uuid PRIMARY KEY REFERENCES flower_designs(id) ON DELETE CASCADE,
  center_color varchar(7) NOT NULL,
  center_density real NOT NULL DEFAULT 1 CHECK (center_density BETWEEN 0.25 AND 2),
  center_size real NOT NULL DEFAULT 1 CHECK (center_size BETWEEN 0.5 AND 1.7),
  center_profile real NOT NULL DEFAULT 1 CHECK (center_profile BETWEEN 0.4 AND 1.8),
  center_floret_size real NOT NULL DEFAULT 1 CHECK (center_floret_size BETWEEN 0.5 AND 1.8),
  center_spread real NOT NULL DEFAULT 1 CHECK (center_spread BETWEEN 0.5 AND 1.35),
  center_stamen_length real NOT NULL DEFAULT 1 CHECK (center_stamen_length BETWEEN 0.4 AND 2),
  center_anther_size real NOT NULL DEFAULT 1 CHECK (center_anther_size BETWEEN 0.4 AND 2),
  center_stigma_size real NOT NULL DEFAULT 1 CHECK (center_stigma_size BETWEEN 0.4 AND 2),
  sepal_size real NOT NULL DEFAULT 1 CHECK (sepal_size BETWEEN 0.5 AND 1.8),
  sepal_spread real NOT NULL DEFAULT 0.35 CHECK (sepal_spread BETWEEN 0 AND 1),
  stem_color varchar(7) NOT NULL,
  background_color varchar(7) NOT NULL,
  stem_curve real NOT NULL CHECK (stem_curve >= 0),
  stem_height real NOT NULL DEFAULT 1 CHECK (stem_height BETWEEN 0.65 AND 1.35),
  stem_thickness real NOT NULL DEFAULT 1 CHECK (stem_thickness BETWEEN 0.5 AND 1.8),
  stem_taper real NOT NULL DEFAULT 0.38 CHECK (stem_taper BETWEEN 0 AND 0.7),
  stem_node_count smallint NOT NULL DEFAULT 2 CHECK (stem_node_count BETWEEN 0 AND 8),
  stem_hair_density real NOT NULL DEFAULT 1 CHECK (stem_hair_density BETWEEN 0 AND 2),
  leaf_density real NOT NULL DEFAULT 1 CHECK (leaf_density BETWEEN 0 AND 2),
  leaf_length real NOT NULL DEFAULT 1 CHECK (leaf_length BETWEEN 0.5 AND 1.6),
  leaf_width real NOT NULL DEFAULT 1 CHECK (leaf_width BETWEEN 0.5 AND 1.6),
  leaf_curl real NOT NULL DEFAULT 0.35 CHECK (leaf_curl BETWEEN 0 AND 1),
  leaf_serration real NOT NULL DEFAULT 1 CHECK (leaf_serration BETWEEN 0 AND 2),
  leaf_vein_density real NOT NULL DEFAULT 1 CHECK (leaf_vein_density BETWEEN 0.25 AND 2),
  leaf_droop real NOT NULL DEFAULT 0.25 CHECK (leaf_droop BETWEEN 0 AND 1),
  leaf_asymmetry real NOT NULL DEFAULT 0.08 CHECK (leaf_asymmetry BETWEEN 0 AND 0.4),
  leaf_age real NOT NULL DEFAULT 0 CHECK (leaf_age BETWEEN 0 AND 1),
  bloom_tilt real NOT NULL DEFAULT 0 CHECK (bloom_tilt BETWEEN -0.6 AND 0.6),
  bloom_turn real NOT NULL DEFAULT 0 CHECK (bloom_turn BETWEEN -3.15 AND 3.15),
  light_intensity real NOT NULL CHECK (light_intensity >= 0),
  grid_enabled boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS flower_designs_created_at_idx
ON flower_designs (created_at DESC);
