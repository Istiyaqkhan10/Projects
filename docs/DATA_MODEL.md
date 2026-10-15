# Data Model Specification — InteriorAI Studio

## Relational Entity Schema

### 1. `users`
- `id`: UUID (Primary Key)
- `email`: VARCHAR(255), Unique, Indexed
- `password_hash`: VARCHAR(255), Not Null
- `created_at`: TIMESTAMPTZ, Default NOW()
- `updated_at`: TIMESTAMPTZ, Default NOW()

### 2. `projects`
- `id`: UUID (Primary Key)
- `owner_id`: UUID, Foreign Key (`users.id`), On Delete CASCADE
- `name`: VARCHAR(255), Not Null
- `description`: TEXT, Nullable
- `created_at`: TIMESTAMPTZ, Default NOW()
- `updated_at`: TIMESTAMPTZ, Default NOW()

### 3. `rooms`
- `id`: UUID (Primary Key)
- `project_id`: UUID, Foreign Key (`projects.id`), On Delete CASCADE
- `name`: VARCHAR(255), Not Null
- `width_m`: NUMERIC(6, 3), Check (`width_m > 0`)
- `length_m`: NUMERIC(6, 3), Check (`length_m > 0`)
- `height_m`: NUMERIC(6, 3), Check (`height_m > 0`)
- `created_at`: TIMESTAMPTZ, Default NOW()
- `updated_at`: TIMESTAMPTZ, Default NOW()

### 4. `scenes`
- `id`: UUID (Primary Key)
- `project_id`: UUID, Foreign Key (`projects.id`), On Delete CASCADE
- `room_id`: UUID, Foreign Key (`rooms.id`), On Delete CASCADE
- `revision`: INTEGER, Not Null, Default 1 (Monotonic counter)
- `schema_version`: INTEGER, Not Null, Default 1
- `scene_document`: JSONB, Not Null (Validated canonical scene JSON)
- `created_at`: TIMESTAMPTZ, Default NOW()
- `updated_at`: TIMESTAMPTZ, Default NOW()
- *Constraints*: Unique (`room_id`, `revision`)

### 5. `catalog_items`
- `id`: VARCHAR(128) (Primary Key, e.g. `cat-sofa-3seater`)
- `name`: VARCHAR(255), Not Null
- `category`: VARCHAR(64), Not Null, Indexed
- `manufacturer`: VARCHAR(255), Nullable
- `description`: TEXT, Nullable
- `width_m`: NUMERIC(6, 3), Check (`width_m > 0`)
- `depth_m`: NUMERIC(6, 3), Check (`depth_m > 0`)
- `height_m`: NUMERIC(6, 3), Check (`height_m > 0`)
- `price_paise`: BIGINT, Check (`price_paise >= 0`) (Integer minor units)
- `currency`: VARCHAR(3), Default 'INR'
- `asset_reference`: VARCHAR(512), Nullable (Path to 3D model asset)
- `source_url`: VARCHAR(1024), Nullable
- `source_verified_at`: TIMESTAMPTZ, Nullable
- `license_information`: VARCHAR(255), Not Null
- `is_active`: BOOLEAN, Default TRUE
- `created_at`: TIMESTAMPTZ, Default NOW()
- `updated_at`: TIMESTAMPTZ, Default NOW()

### 6. `estimates`
- `id`: UUID (Primary Key)
- `project_id`: UUID, Foreign Key (`projects.id`), On Delete CASCADE
- `scene_revision`: INTEGER, Not Null
- `estimate_snapshot`: JSONB, Not Null (Immutable itemized lines & assumptions)
- `subtotal_paise`: BIGINT, Not Null
- `tax_paise`: BIGINT, Not Null
- `total_paise`: BIGINT, Not Null
- `currency`: VARCHAR(3), Default 'INR'
- `assumptions`: TEXT, Nullable
- `created_at`: TIMESTAMPTZ, Default NOW()

### 7. `ai_layout_proposals`
- `id`: UUID (Primary Key)
- `project_id`: UUID, Foreign Key (`projects.id`), On Delete CASCADE
- `base_scene_revision`: INTEGER, Not Null
- `request_parameters`: JSONB, Not Null
- `proposal_document`: JSONB, Not Null
- `validation_status`: VARCHAR(32), Not Null (e.g., `VALID`, `INVALID`, `WARNINGS`)
- `created_at`: TIMESTAMPTZ, Default NOW()
