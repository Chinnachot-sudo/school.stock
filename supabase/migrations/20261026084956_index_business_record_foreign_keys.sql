create index if not exists requisitions_item_id_idx on public.requisitions (item_id);
create index if not exists requisitions_department_id_idx on public.requisitions (department_id);
create index if not exists requisitions_reviewed_by_idx on public.requisitions (reviewed_by);
create index if not exists issue_reports_item_id_idx on public.issue_reports (item_id);
create index if not exists issue_reports_resolved_by_idx on public.issue_reports (resolved_by);
create index if not exists assets_created_by_idx on public.assets (created_by);
