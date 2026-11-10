-- Read-only. Verify dedicated disposable synthetic DB and zero prior fw namespace before 001.
SELECT current_database(),current_user,current_setting('server_version_num')::integer>=160000 AS supported_version;
SELECT nspname FROM pg_namespace WHERE nspname='fw';
-- Abort manual run if fw already exists, destination is shared/real, or backup/restore path is unclear.
