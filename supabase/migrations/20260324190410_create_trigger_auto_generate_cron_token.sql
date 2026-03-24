-- Create function to auto-generate cron_secret_token
CREATE OR REPLACE FUNCTION generate_cron_secret_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cron_secret_token IS NULL THEN
    NEW.cron_secret_token := 'cron_sk_' || NEW.id::text || '_' || encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS trigger_auto_generate_cron_token ON organizations;
CREATE TRIGGER trigger_auto_generate_cron_token
BEFORE INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION generate_cron_secret_token();-- Create function to auto-generate cron_secret_token
CREATE OR REPLACE FUNCTION generate_cron_secret_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cron_secret_token IS NULL THEN
    NEW.cron_secret_token := 'cron_sk_' || NEW.id::text || '_' || encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS trigger_auto_generate_cron_token ON organizations;
CREATE TRIGGER trigger_auto_generate_cron_token
BEFORE INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION generate_cron_secret_token();
