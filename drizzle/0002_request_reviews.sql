CREATE TABLE hub_reviews (
 owner TEXT NOT NULL,
 request_key TEXT NOT NULL,
 input_hash TEXT NOT NULL,
 payload TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY (owner, request_key)
);
--> statement-breakpoint
CREATE TABLE hub_review_cache (
 owner TEXT NOT NULL,
 cache_key TEXT NOT NULL,
 payload TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY (owner, cache_key)
);
--> statement-breakpoint
CREATE TABLE hub_reply_drafts (
 owner TEXT NOT NULL,
 request_key TEXT NOT NULL,
 body TEXT NOT NULL,
 updated_at INTEGER NOT NULL,
 PRIMARY KEY (owner, request_key)
);
