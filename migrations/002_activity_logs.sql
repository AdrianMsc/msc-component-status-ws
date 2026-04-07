CREATE TABLE IF NOT EXISTS activity_logs (
  id bigserial PRIMARY KEY,
  entity text NOT NULL DEFAULT 'component',
  action text NOT NULL,
  component_id bigint NULL REFERENCES component(id) ON DELETE SET NULL,
  actor_user_id bigint NULL REFERENCES users(id) ON DELETE SET NULL,
  actor_email text NULL,
  actor_role text NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_logs_action_check CHECK (action IN ('component.created', 'component.updated', 'component.deleted'))
);

CREATE INDEX IF NOT EXISTS activity_logs_component_id_idx ON activity_logs(component_id);
CREATE INDEX IF NOT EXISTS activity_logs_action_idx ON activity_logs(action);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs(created_at DESC);
