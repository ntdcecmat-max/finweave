-- Additive correction: an expired immutable preview is a temporary payload,
-- not ledger history. Limit the privileged trigger exception to preview tables.
CREATE OR REPLACE FUNCTION fw_control.purge_runtime_payloads() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE prior_replication_role text;BEGIN
 PERFORM 1 FROM fw_control.state FOR SHARE;
 UPDATE fw_auth.replays SET body=NULL WHERE body IS NOT NULL AND expires_at<=clock_timestamp();
 UPDATE fw_ops.replays SET body=NULL WHERE body IS NOT NULL AND expires_at<=clock_timestamp();
 DELETE FROM fw_auth.nonces WHERE expires_at<=clock_timestamp();
 DELETE FROM fw_auth.challenges WHERE expires_at<clock_timestamp()-interval '24 hours';
 prior_replication_role:=current_setting('session_replication_role');
 PERFORM set_config('session_replication_role','replica',true);
 DELETE FROM fw_finance.previews WHERE expires_at<=clock_timestamp();
 DELETE FROM fw_ops.previews WHERE expires_at<=clock_timestamp();
 PERFORM set_config('session_replication_role',prior_replication_role,true);
 DELETE FROM fw_assistant.messages m WHERE expires_at<=clock_timestamp()
 AND NOT EXISTS(SELECT 1 FROM fw_assistant.runs r WHERE r.workspace_id=m.workspace_id AND r.conversation_id=m.conversation_id AND r.payload->>'state' IN('queued','reading','simulating'));
 DELETE FROM fw_assistant.tool_snapshots s WHERE expires_at<=clock_timestamp()
 AND NOT EXISTS(SELECT 1 FROM fw_assistant.runs r WHERE r.workspace_id=s.workspace_id AND r.payload->>'state' IN('queued','reading','simulating'));
 DELETE FROM fw_assistant.drafts d WHERE expires_at<=clock_timestamp() AND d.payload->>'state' IN('draft','previewed','cancelled')
 AND NOT EXISTS(SELECT 1 FROM fw_assistant.goal_plan_links l WHERE l.workspace_id=d.workspace_id AND l.draft_id=d.id)
 AND NOT EXISTS(SELECT 1 FROM fw_assistant.simulations s WHERE s.workspace_id=d.workspace_id AND s.draft_id=d.id)
 AND NOT EXISTS(SELECT 1 FROM fw_assistant.runs r WHERE r.workspace_id=d.workspace_id AND r.payload->>'draftId'=d.id AND r.payload->>'state' IN('queued','reading','simulating'));
 PERFORM set_config('session_replication_role','replica',true);
 DELETE FROM fw_business.import_previews p WHERE expires_at<=clock_timestamp()
 AND NOT EXISTS(SELECT 1 FROM fw_business.imports i WHERE i.workspace_id=p.workspace_id AND i.preview_id=p.id);
 PERFORM set_config('session_replication_role',prior_replication_role,true);
 RETURN jsonb_build_object('purged',true);
END $$;
REVOKE ALL ON FUNCTION fw_control.purge_runtime_payloads() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_control.purge_runtime_payloads() TO fw_runtime_retention;
