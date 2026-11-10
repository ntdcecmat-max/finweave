-- Restored Ops principals must receive a new factor via privileged provisioning.
ALTER TABLE fw_ops.identities ADD COLUMN active boolean NOT NULL DEFAULT true;
