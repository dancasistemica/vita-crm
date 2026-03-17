INSERT INTO system_settings (setting_key, setting_value)
VALUES ('sidebar_bg_color', '#1e1e2e')
ON CONFLICT (setting_key) DO NOTHING;