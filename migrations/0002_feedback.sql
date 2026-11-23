CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site TEXT NOT NULL,
  subject TEXT NOT NULL,
  request_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  resource TEXT NOT NULL,
  revision TEXT NOT NULL,
  anchor TEXT NOT NULL,
  quote TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('question','problem','suggestion')),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),
  author TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(site, subject, request_id)
);
CREATE INDEX feedback_inbox ON feedback(site, id);
