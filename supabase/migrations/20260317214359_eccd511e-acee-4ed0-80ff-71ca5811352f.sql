
INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('color_hover',            '#6d28d9'),
  ('color_active',           '#5b21b6'),
  ('color_selected_bg',      '#ede9fe'),
  ('color_selected_text',    '#5b21b6'),
  ('color_text_primary',     '#111827'),
  ('color_text_secondary',   '#6b7280'),
  ('color_background',       '#f9fafb'),
  ('color_card_bg',          '#ffffff'),
  ('color_border',           '#e5e7eb'),
  ('color_success',          '#10b981'),
  ('color_warning',          '#f59e0b'),
  ('color_error',            '#ef4444'),
  ('color_info',             '#3b82f6'),
  ('color_button_text',      '#ffffff'),
  ('color_sidebar_text',     '#f3f4f6'),
  ('color_sidebar_hover',    '#4c1d95'),
  ('color_sidebar_selected', '#7c3aed')
ON CONFLICT (setting_key) DO NOTHING;
