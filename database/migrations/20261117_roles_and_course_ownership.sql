DO $$
BEGIN
  CREATE TYPE users_role_enum AS ENUM ('admin', 'teacher', 'student');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role users_role_enum NOT NULL DEFAULT 'student';

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS created_by_user_id integer;
