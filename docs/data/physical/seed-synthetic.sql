-- Dedicated disposable DB only; .test identities and made-up amounts. Disposable superuser seed only.
BEGIN;
INSERT INTO fw.identities(id,email,display_name,credential_hash,state) VALUES
 ('U_A','a@finweave.test','Synthetic A','DISABLED_NOT_A_PASSWORD_HASH','active'),
 ('U_B','b@finweave.test','Synthetic B','DISABLED_NOT_A_PASSWORD_HASH','active');
INSERT INTO fw.workspaces(id,owner_id,tracking_start) VALUES ('W_A','U_A','2026-10-01'),('W_B','U_B','2026-10-01');
INSERT INTO fw.accounts(workspace_id,id,name,kind,opening,opening_date) VALUES
 ('W_A','A_BANK','Synthetic bank','bank',10000000,'2026-10-01'),('W_B','B_BANK','Synthetic bank B','bank',0,'2026-10-01');
INSERT INTO fw.ledger_accounts(workspace_id,id,account_id,kind) VALUES ('W_A','LA_BANK','A_BANK','asset'),('W_A','LA_EQUITY',NULL,'equity');
INSERT INTO fw.events(workspace_id,id,kind,amount,business_date,account_id,category,description,posting) VALUES
 ('W_A','EV_OPEN','opening',10000000,'2026-10-01','A_BANK','opening','Synthetic opening, excluded from income','posted');
INSERT INTO fw.entry_groups(workspace_id,id,event_id) VALUES ('W_A','G_OPEN','EV_OPEN');
INSERT INTO fw.posting_lines(workspace_id,id,group_id,ledger_account_id,signed_amount) VALUES
 ('W_A','L_OPEN_1','G_OPEN','LA_BANK',10000000),('W_A','L_OPEN_2','G_OPEN','LA_EQUITY',-10000000);
INSERT INTO fw.devices(workspace_id,id,owner_id,platform,public_key,key_digest,name,app_version,consent_version,status) VALUES
 ('W_A','D_A','U_A','android','SYNTHETIC_NONCRYPTO_KEY','SYNTHETIC_DIGEST','Synthetic Android','fixture-1','2026-10-08','active');
INSERT INTO fw.collector_bindings(workspace_id,id,device_id,account_id,package_name,parser_profile_id,consent_at) VALUES
 ('W_A','BIND_A','D_A','A_BANK','test.finweave.bank','SYNTHETIC_BANK_V1',now());
INSERT INTO fw.ingestion_receipts(workspace_id,id,device_id,binding_id,binding_version,event_key,revision,source_key,observed_at,parser_version,payload_digest,normalized_evidence,state,ack_at) VALUES
 ('W_A','R_A','D_A','BIND_A',1,'NOTIF_A',0,'test_bank',now(),'SYNTHETIC_BANK_V1',repeat('a',64),'{"amount":"100000","currency":"VND","direction":"income","sourceAccountRef":null,"transactionRef":"SYNTH_01","sourceOccurredAt":null,"ruleStatus":"complete"}','received',now());
COMMIT;
