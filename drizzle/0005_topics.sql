CREATE TABLE hub_topics (owner TEXT NOT NULL, request_key TEXT NOT NULL, topic_id TEXT NOT NULL, label TEXT NOT NULL, PRIMARY KEY(owner,request_key));
CREATE INDEX hub_topics_group ON hub_topics(owner,topic_id);
