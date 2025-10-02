-- drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS recruiter_actions;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;


-- table: companies
-- description: stores information about the companies posting jobs.
CREATE TABLE companies (
    company_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(255), -- URL to company logo in cloud storage
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- table: users
-- description: stores information for all user types: job seekers, recruiters, and superadmins.
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- hashed password for dashboard login

    -- Profile Information (primarily for job seekers)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    university VARCHAR(255),
    skills TEXT[], -- Using a native PostgreSQL array for efficient querying
    interests TEXT[],

    -- System & Role Information
    role VARCHAR(50) NOT NULL CHECK (role IN ('seeker', 'admin', 'superadmin')),
    messenger_psid VARCHAR(255) UNIQUE, -- Page-Scoped ID from Facebook Messenger. Unique and nullable.
    resume_url VARCHAR(255), -- URL to resume file in cloud storage

    -- Association for Admins
    company_id BIGINT REFERENCES companies(company_id) ON DELETE SET NULL, -- A recruiter belongs to a company.

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- table: jobs
-- description: stores job postings created by recruiters.
CREATE TABLE jobs (
    job_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES companies(company_id) ON DELETE RESTRICT,
    created_by_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT, -- The recruiter who posted the job

    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    employment_type VARCHAR(100) CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),

    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- To deactivate jobs without deleting them

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- table: applications
-- description: a join table representing a job seeker's application to a specific job.
-- it also tracks the current status of that application.
CREATE TABLE applications (
    application_id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(job_id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,

    status VARCHAR(50) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'rejected')),

    -- Timestamps
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Specific name for when the application was submitted
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A user can only apply to the same job once.
    UNIQUE (job_id, user_id)
);

-- table: recruiter_actions
-- description: an audit log of actions performed by recruiters on applications.
-- this provides a history of who did what and when, separate from the application's current state.
CREATE TABLE recruiter_actions (
    action_id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    recruiter_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,

    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('shortlist', 'reject')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- indexes for Performance
-- description: Creating indexes on foreign keys and frequently queried columns
-- to speed up database lookups.
-- users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_messenger_psid ON users(messenger_psid);

-- jobs table indexes
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_created_by ON jobs(created_by_user_id);

-- applications table indexes
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);

-- recruiter Actions table indexes
CREATE INDEX idx_recruiter_actions_application_id ON recruiter_actions(application_id);
CREATE INDEX idx_recruiter_actions_recruiter_id ON recruiter_actions(recruiter_user_id);
