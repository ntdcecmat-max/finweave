CREATE UNIQUE INDEX CONCURRENTLY db005_quota ON fw.provider_quota_buckets USING btree (namespace_digest, window_start, window_end);
