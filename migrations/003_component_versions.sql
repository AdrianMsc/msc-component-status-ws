-- Component Versioning System
-- Migration 003: Add component_versions table

-- Create component_versions table to track component versions
CREATE TABLE IF NOT EXISTS component_versions (
  id bigserial PRIMARY KEY,
  component_id bigint NOT NULL REFERENCES component(id) ON DELETE CASCADE,
  version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_latest boolean NOT NULL DEFAULT true,
  UNIQUE (component_id, version)
);

-- Index for faster queries by component
CREATE INDEX IF NOT EXISTS component_versions_component_id_idx ON component_versions(component_id);

-- Index for getting latest version
CREATE INDEX IF NOT EXISTS component_versions_is_latest_idx ON component_versions(component_id) WHERE is_latest = true;

-- Add version column to component table (for backward compatibility, first version is 1.0.0)
ALTER TABLE component ADD COLUMN IF NOT EXISTS current_version text NOT NULL DEFAULT '1.0.0';
