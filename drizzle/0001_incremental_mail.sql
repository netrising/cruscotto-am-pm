CREATE TABLE hub_mail (
 owner TEXT NOT NULL,
 source_id TEXT NOT NULL,
 received_at TEXT NOT NULL,
 group_name TEXT NOT NULL,
 client TEXT NOT NULL,
 payload TEXT NOT NULL,
 PRIMARY KEY (owner, source_id)
);
--> statement-breakpoint
CREATE INDEX hub_mail_owner_date ON hub_mail (owner, received_at);
--> statement-breakpoint
CREATE TABLE hub_sync (
 owner TEXT NOT NULL,
 source TEXT NOT NULL,
 watermark TEXT NOT NULL,
 window_lower TEXT,
 window_upper TEXT,
 next_index INTEGER NOT NULL DEFAULT 0,
 checked_at TEXT,
 lock_token TEXT,
 lock_until INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY (owner, source)
);
