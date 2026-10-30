CREATE TABLE hub_approvals (
  owner TEXT NOT NULL,
  request_key TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  state TEXT NOT NULL,
  payload TEXT NOT NULL,
  result TEXT,
  PRIMARY KEY (owner, request_key),
  UNIQUE (owner, fingerprint)
);
--> statement-breakpoint
CREATE TABLE hub_drafts (
  owner TEXT NOT NULL,
  request_key TEXT NOT NULL,
  payload TEXT NOT NULL,
  state TEXT NOT NULL,
  PRIMARY KEY (owner, request_key)
);
--> statement-breakpoint
CREATE TABLE hub_checks (
  owner TEXT NOT NULL,
  receipt TEXT NOT NULL,
  request_key TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (owner, receipt)
);
