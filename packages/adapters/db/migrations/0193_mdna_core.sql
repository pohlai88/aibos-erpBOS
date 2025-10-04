-- M26: MD&A (Management Discussion & Analysis) Core Tables
-- Data-bound sections + templates, variables (KPIs/flux/cash), versioned drafts, publish & freeze

-- MD&A Templates
CREATE TABLE mdna_template (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sections JSONB NOT NULL DEFAULT '{}',
    variables JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- MD&A Drafts
CREATE TABLE mdna_draft (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL REFERENCES mdna_template(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{}',
    variables JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'EDITING' CHECK (status IN ('EDITING', 'REVIEW', 'APPROVED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by TEXT NOT NULL
);

-- MD&A Published Versions
CREATE TABLE mdna_publish (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    run_id TEXT REFERENCES close_run(id) ON DELETE CASCADE,
    draft_id TEXT NOT NULL REFERENCES mdna_draft(id) ON DELETE CASCADE,
    html_uri TEXT NOT NULL,
    checksum TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_by TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX mdna_template_company_status_idx ON mdna_template(company_id, status);
CREATE INDEX mdna_draft_company_run_idx ON mdna_draft(company_id, run_id);
CREATE INDEX mdna_draft_template_idx ON mdna_draft(template_id);
CREATE INDEX mdna_draft_status_idx ON mdna_draft(company_id, status);
CREATE INDEX mdna_publish_company_run_idx ON mdna_publish(company_id, run_id);
CREATE INDEX mdna_publish_draft_idx ON mdna_publish(draft_id);

-- Comments for documentation
COMMENT ON TABLE mdna_template IS 'MD&A templates with sections and variable definitions';
COMMENT ON TABLE mdna_draft IS 'MD&A drafts with resolved content and variables';
COMMENT ON TABLE mdna_publish IS 'Published MD&A versions with immutable HTML and checksum';
COMMENT ON COLUMN mdna_template.sections IS 'Template sections structure (JSON)';
COMMENT ON COLUMN mdna_template.variables IS 'Available variables and their definitions (JSON)';
COMMENT ON COLUMN mdna_draft.content IS 'Resolved content with variable substitutions (JSON)';
COMMENT ON COLUMN mdna_draft.variables IS 'Variable values used in this draft (JSON)';
COMMENT ON COLUMN mdna_publish.html_uri IS 'URI to the published HTML content';
COMMENT ON COLUMN mdna_publish.checksum IS 'SHA256 checksum of the published content';
