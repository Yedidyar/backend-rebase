CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY NOT NULL,
  name VARCHAR(200) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY NOT NULL,
  name VARCHAR(200) UNIQUE NOT NULL,
  date Date,
  hour smallint,
  views_count bigint
);

CREATE INDEX IF NOT EXISTS idx_page_views_name_date_hour ON page_views (name, date, hour);

CREATE MATERIALIZED VIEW IF NOT EXISTS page_views_report AS
SELECT
  p.id AS page_id,
  p.name AS page_name,
  pv.date,
  pv.hour,
  pv.views_count
FROM
  page_views pv
JOIN
  pages p
ON
  pv.name = p.name;

CREATE INDEX IF NOT EXISTS idx_page_views_report_name_date_hour ON page_views_report (page_name, date, hour);