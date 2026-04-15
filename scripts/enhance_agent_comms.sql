-- Enhanced Agent Communications Schema
-- Extend existing agent_architect_comms table for 3-way communication

-- Add new columns to existing table
ALTER TABLE agent_architect_comms 
ADD COLUMN IF NOT EXISTS recipient TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS command TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_comms_recipient ON agent_architect_comms(recipient);
CREATE INDEX IF NOT EXISTS idx_agent_comms_priority ON agent_architect_comms(priority);
CREATE INDEX IF NOT EXISTS idx_agent_comms_status ON agent_architect_comms(status);
CREATE INDEX IF NOT EXISTS idx_agent_comms_sender_recipient ON agent_architect_comms(sender, recipient);

-- Add constraint for valid sender values
ALTER TABLE agent_architect_comms 
ADD CONSTRAINT IF NOT EXISTS valid_sender 
CHECK (sender IN ('nova', 'windsurf', 'antigravity', 'vps_heartbeat'));

-- Add constraint for valid recipient values  
ALTER TABLE agent_architect_comms
ADD CONSTRAINT IF NOT EXISTS valid_recipient
CHECK (recipient IN ('nova', 'windsurf', 'antigravity', 'all'));

-- Add constraint for valid priority values
ALTER TABLE agent_architect_comms
ADD CONSTRAINT IF NOT EXISTS valid_priority
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Add constraint for valid status values
ALTER TABLE agent_architect_comms
ADD CONSTRAINT IF NOT EXISTS valid_status
CHECK (status IN ('unread', 'read', 'processed'));

-- Create view for agent status tracking
CREATE OR REPLACE VIEW agent_status_view AS
SELECT 
  sender,
  MAX(created_at) as last_seen,
  message as last_message,
  CASE 
    WHEN created_at > NOW() - INTERVAL '5 minutes' THEN 'active'
    WHEN created_at > NOW() - INTERVAL '1 hour' THEN 'idle'
    ELSE 'offline'
  END as status
FROM agent_architect_comms 
WHERE sender != 'vps_heartbeat'
GROUP BY sender, message, created_at
ORDER BY created_at DESC;

-- Create function to cleanup old messages
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  -- Delete messages older than 24 hours
  DELETE FROM agent_architect_comms 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Delete processed messages older than 1 hour
  DELETE FROM agent_architect_comms 
  WHERE status = 'processed' 
  AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic cleanup (optional)
-- CREATE OR REPLACE FUNCTION auto_cleanup_trigger()
-- RETURNS trigger AS $$
-- BEGIN
--   PERFORM cleanup_old_messages();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Uncomment below to enable automatic cleanup
-- CREATE TRIGGER trigger_auto_cleanup
-- AFTER INSERT ON agent_architect_comms
-- FOR EACH ROW
-- EXECUTE FUNCTION auto_cleanup_trigger();

COMMENT ON TABLE agent_architect_comms IS 'Enhanced 3-way agent communication system supporting Nova, Windsurf, and Anti-Gravity coordination';
COMMENT ON VIEW agent_status_view IS 'Real-time agent status tracking for multi-agent coordination';
