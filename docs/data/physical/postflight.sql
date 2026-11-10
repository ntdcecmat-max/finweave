-- Read-only after migrations + synthetic seed; these are assertions to execute, NOT current PASS.
SELECT count(*) AS expected_54_tables FROM information_schema.tables WHERE table_schema='fw';
SELECT n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='fw' AND c.relkind='r';
SELECT workspace_id,group_id,sum(signed_amount) AS must_be_zero,count(*)>=2 AS enough_lines FROM fw.posting_lines GROUP BY workspace_id,group_id;
SELECT count(*) AS expected_1_durable_unposted_receipt FROM fw.ingestion_receipts WHERE state='received' AND event_id IS NULL AND ack_at IS NOT NULL;
SELECT sum(p.signed_amount) AS expected_10000000 FROM fw.posting_lines p JOIN fw.ledger_accounts a ON a.workspace_id=p.workspace_id AND a.id=p.ledger_account_id WHERE a.account_id='A_BANK';
