-- Retain keyed committed markers while erasing expired credential response bodies.
ALTER TABLE fw_auth.replays ALTER COLUMN body DROP NOT NULL;
ALTER TABLE fw_ops.replays ALTER COLUMN body DROP NOT NULL;
