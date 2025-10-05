-- M16: Asset Class Reference
-- Defines depreciation methods and default parameters for asset classes

CREATE TABLE IF NOT EXISTS asset_class_ref (
  code           TEXT PRIMARY KEY,         -- e.g., "PLANT", "IT", "FURN"
  label          TEXT NOT NULL,
  method         TEXT NOT NULL,            -- SL | DDB | SYD (we'll implement SL + DDB first)
  default_life_m INT  NOT NULL,            -- in months (e.g., 60)
  residual_pct   NUMERIC NOT NULL DEFAULT 0
);

-- Seed common asset classes
INSERT INTO asset_class_ref(code, label, method, default_life_m, residual_pct) VALUES
('IT', 'IT Equipment', 'SL', 36, 0),
('PLANT', 'Plant & Machinery', 'DDB', 60, 5),
('FURN', 'Furniture & Fixtures', 'SL', 60, 0),
('VEHICLE', 'Vehicles', 'DDB', 48, 10),
('BUILDING', 'Buildings', 'SL', 240, 0)
ON CONFLICT (code) DO NOTHING;
