-- Canonical review events; every other new table is a rebuildable projection.
CREATE TABLE review_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site TEXT NOT NULL,
  family TEXT NOT NULL CHECK(family IN ('feedback','discussions')),
  target_id INTEGER NOT NULL,
  version INTEGER NOT NULL CHECK(version > 0),
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  subject TEXT NOT NULL,
  author TEXT NOT NULL,
  request_id TEXT,
  payload TEXT,
  changed_at TEXT NOT NULL,
  cause TEXT NOT NULL CHECK(cause IN ('manual','reply')),
  comment_id INTEGER,
  UNIQUE(site,family,target_id,version),
  UNIQUE(site,family,subject,request_id),
  UNIQUE(site,family,comment_id)
);

CREATE TABLE review_heads (
  site TEXT NOT NULL,
  family TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  version INTEGER NOT NULL,
  PRIMARY KEY(site,family,target_id)
);

CREATE TRIGGER review_project AFTER INSERT ON review_events BEGIN
  INSERT INTO review_heads(site,family,target_id,status,version)
  VALUES(NEW.site,NEW.family,NEW.target_id,NEW.to_status,NEW.version)
  ON CONFLICT(site,family,target_id) DO UPDATE SET status=excluded.status,version=excluded.version;
END;

CREATE TABLE thread_members (
  comment_id INTEGER PRIMARY KEY REFERENCES comments(id),
  root_id INTEGER NOT NULL REFERENCES comments(id),
  site TEXT NOT NULL
);
CREATE INDEX thread_roots ON thread_members(site,root_id,comment_id);

INSERT INTO thread_members(comment_id,root_id,site)
WITH RECURSIVE tree(id,root_id,site) AS (
  SELECT id,id,site FROM comments WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id,t.root_id,c.site FROM comments c JOIN tree t ON c.parent_id=t.id WHERE c.site=t.site
) SELECT id,root_id,site FROM tree;

CREATE VIRTUAL TABLE feedback_search USING fts5(body,quote,resource,author,tokenize='unicode61 remove_diacritics 2');
CREATE VIRTUAL TABLE comment_search USING fts5(body,quote,resource,author,tokenize='unicode61 remove_diacritics 2');
INSERT INTO feedback_search(rowid,body,quote,resource,author) SELECT id,body,quote,resource,author FROM feedback;
INSERT INTO comment_search(rowid,body,quote,resource,author) SELECT id,body,quote,resource,author FROM comments;

CREATE TRIGGER feedback_index AFTER INSERT ON feedback BEGIN
  INSERT INTO feedback_search(rowid,body,quote,resource,author) VALUES(NEW.id,NEW.body,NEW.quote,NEW.resource,NEW.author);
END;

CREATE TRIGGER comment_project AFTER INSERT ON comments BEGIN
  INSERT INTO thread_members(comment_id,root_id,site) VALUES(NEW.id,CASE WHEN NEW.parent_id IS NULL THEN NEW.id ELSE (SELECT root_id FROM thread_members WHERE comment_id=NEW.parent_id AND site=NEW.site) END,NEW.site);
  INSERT INTO comment_search(rowid,body,quote,resource,author) VALUES(NEW.id,NEW.body,NEW.quote,NEW.resource,NEW.author);
  INSERT INTO review_events(site,family,target_id,version,from_status,to_status,subject,author,changed_at,cause,comment_id)
  SELECT NEW.site,'discussions',h.target_id,h.version+1,'resolved','open',NEW.subject,NEW.author,NEW.created_at,'reply',NEW.id
  FROM review_heads h JOIN thread_members m ON m.root_id=h.target_id AND m.comment_id=NEW.id
  WHERE NEW.parent_id IS NOT NULL AND h.site=NEW.site AND h.family='discussions' AND h.status='resolved';
END;

CREATE INDEX feedback_review_order ON feedback(site,created_at,id);
CREATE INDEX comments_review_order ON comments(site,created_at,id);
