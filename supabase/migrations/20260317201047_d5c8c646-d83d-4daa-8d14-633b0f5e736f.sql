
-- Step 1: Migrate existing data to custom_data JSONB
UPDATE leads
SET custom_data = COALESCE(custom_data, '{}'::jsonb) || jsonb_build_object(
  'pain_point', COALESCE(pain_point, ''),
  'body_tension_area', COALESCE(body_tension_area, ''),
  'emotional_goal', COALESCE(emotional_goal, '')
)
WHERE (pain_point IS NOT NULL AND pain_point != '')
   OR (body_tension_area IS NOT NULL AND body_tension_area != '')
   OR (emotional_goal IS NOT NULL AND emotional_goal != '');

-- Step 2: Insert custom_fields for all existing organizations
INSERT INTO custom_fields (organization_id, field_name, field_label, field_type, is_required, is_active, display_order)
SELECT o.id, 'pain_point', 'Dor Principal', 'textarea', false, true, 1
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM custom_fields cf WHERE cf.organization_id = o.id AND cf.field_name = 'pain_point');

INSERT INTO custom_fields (organization_id, field_name, field_label, field_type, is_required, is_active, display_order)
SELECT o.id, 'body_tension_area', 'Área de Tensão no Corpo', 'text', false, true, 2
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM custom_fields cf WHERE cf.organization_id = o.id AND cf.field_name = 'body_tension_area');

INSERT INTO custom_fields (organization_id, field_name, field_label, field_type, is_required, is_active, display_order)
SELECT o.id, 'emotional_goal', 'Objetivo Emocional', 'textarea', false, true, 3
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM custom_fields cf WHERE cf.organization_id = o.id AND cf.field_name = 'emotional_goal');

-- Step 3: Drop the old columns
ALTER TABLE leads DROP COLUMN IF EXISTS pain_point;
ALTER TABLE leads DROP COLUMN IF EXISTS body_tension_area;
ALTER TABLE leads DROP COLUMN IF EXISTS emotional_goal;
