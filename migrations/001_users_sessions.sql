CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  provider text NOT NULL,
  provider_subject text NOT NULL,
  email text NULL,
  name text NULL,
  picture text NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject)
);

CREATE TABLE IF NOT EXISTS sessions (
  id bigserial PRIMARY KEY,
  session_id uuid NOT NULL UNIQUE,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  ip text NULL,
  user_agent text NULL,
  data jsonb NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS sessions_revoked_at_idx ON sessions(revoked_at) WHERE revoked_at IS NULL;
