-- NOT RUN. Run each block independently as schema owner in disposable synthetic DB after seed.
-- Expected SQLSTATE 23503 cross-workspace FK; rollback the whole block.
BEGIN;
INSERT INTO fw.collector_bindings(workspace_id,id,device_id,account_id,package_name,parser_profile_id,consent_at)
VALUES ('W_A','BAD_BIND','D_A','B_BANK','test.finweave.bank','SYNTHETIC_BANK_V1',now());
SET CONSTRAINTS ALL IMMEDIATE;
ROLLBACK;
-- Expected 23505 transport replay uniqueness. Never create a second receipt.
BEGIN;
INSERT INTO fw.ingestion_receipts(workspace_id,id,device_id,binding_id,binding_version,event_key,revision,source_key,observed_at,parser_version,payload_digest,state)
SELECT workspace_id,'R_DUP',device_id,binding_id,binding_version,event_key,revision,source_key,observed_at,parser_version,payload_digest,state FROM fw.ingestion_receipts WHERE workspace_id='W_A' AND id='R_A';
ROLLBACK;
-- Expected 23514 immutable posted line.
BEGIN;
UPDATE fw.posting_lines SET signed_amount=1 WHERE workspace_id='W_A' AND id='L_OPEN_1';
ROLLBACK;
