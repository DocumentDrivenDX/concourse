CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site TEXT NOT NULL,
  subject TEXT NOT NULL,
  request_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  resource TEXT NOT NULL,
  anchor TEXT NOT NULL,
  revision TEXT NOT NULL,
  quote TEXT NOT NULL,
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 4000),
  author TEXT NOT NULL,
  created_at TEXT NOT NULL,
  parent_id INTEGER REFERENCES comments(id),
  UNIQUE(site, subject, request_id)
);
CREATE INDEX comments_context ON comments(site, resource, anchor, id);
