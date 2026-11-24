-- Run only during an approved maintenance window with writes paused.
-- Canonical feedback, comments and review_events are not changed.
DELETE FROM review_heads;
INSERT INTO review_heads(site,family,target_id,status,version)
SELECT e.site,e.family,e.target_id,e.to_status,e.version FROM review_events e
WHERE e.version=(SELECT max(x.version) FROM review_events x WHERE x.site=e.site AND x.family=e.family AND x.target_id=e.target_id);
DELETE FROM thread_members;
INSERT INTO thread_members(comment_id,root_id,site)
WITH RECURSIVE tree(id,root_id,site) AS (
  SELECT id,id,site FROM comments WHERE parent_id IS NULL
  UNION ALL SELECT c.id,t.root_id,c.site FROM comments c JOIN tree t ON c.parent_id=t.id WHERE c.site=t.site
) SELECT id,root_id,site FROM tree;
DELETE FROM feedback_search;
INSERT INTO feedback_search(rowid,body,quote,resource,author) SELECT id,body,quote,resource,author FROM feedback;
DELETE FROM comment_search;
INSERT INTO comment_search(rowid,body,quote,resource,author) SELECT id,body,quote,resource,author FROM comments;
