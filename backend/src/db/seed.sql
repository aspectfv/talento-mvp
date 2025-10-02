-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Seed data for the 'companies' table
INSERT INTO companies (name, website, description, logo_url) VALUES
('Innovate Inc.', 'https://innovateinc.com', 'A leading tech company specializing in AI.', 'https://innovateinc.com/logo.png'),
('Quantum Solutions', 'https://quantumsolutions.com', 'Pioneers in quantum computing.', 'https://quantumsolutions.com/logo.png'),
('BioHealth Corp.', 'https://biohealthcorp.com', 'Dedicated to advancing biotechnology.', 'https://biohealthcorp.com/logo.png');

-- Seed data for the 'users' table
-- All passwords are 'password123', hashed using pgcrypto's crypt() function with bcrypt.
INSERT INTO users (email, password_hash, role, first_name, last_name, university, skills, interests, company_id, messenger_psid) VALUES
-- Job Seekers
('john.doe@example.com', crypt('password123', gen_salt('bf')), 'seeker', 'John', 'Doe', 'State University', ARRAY['JavaScript', 'React', 'Node.js'], ARRAY['Web Development', 'AI', 'Hiking'], NULL, 'messenger_psid_1'),
('jane.smith@example.com', crypt('password123', gen_salt('bf')), 'seeker', 'Jane', 'Smith', 'Tech Institute', ARRAY['Python', 'Data Science', 'Machine Learning'], ARRAY['Data Analysis', 'Reading', 'Photography'], NULL, 'messenger_psid_2'),

-- Admins (Recruiters)
('recruiter.innovate@example.com', crypt('password123', gen_salt('bf')), 'admin', 'Recruiter', 'One', NULL, NULL, NULL, 1, NULL),
('recruiter.quantum@example.com', crypt('password123', gen_salt('bf')), 'admin', 'Recruiter', 'Two', NULL, NULL, NULL, 2, NULL),

-- Superadmin
('superadmin@talento.com', crypt('password123', gen_salt('bf')), 'superadmin', 'Super', 'Admin', NULL, NULL, NULL, NULL, NULL);

-- Seed data for the 'jobs' table
INSERT INTO jobs (company_id, created_by_user_id, title, description, location, employment_type) VALUES
(1, 3, 'Frontend Developer', 'Developing and maintaining user-facing features.', 'Remote', 'full-time'),
(1, 3, 'Backend Developer', 'Building and maintaining the server-side logic.', 'New York, NY', 'full-time'),
(2, 4, 'Quantum Researcher', 'Conducting research in quantum algorithms.', 'Palo Alto, CA', 'full-time');

-- Seed data for the 'applications' table
INSERT INTO applications (job_id, user_id, status) VALUES
(1, 1, 'applied'),
(2, 1, 'shortlisted'),
(3, 2, 'applied');

-- Seed data for the 'recruiter_actions' table
INSERT INTO recruiter_actions (application_id, recruiter_user_id, action_type) VALUES
(2, 3, 'shortlist');
