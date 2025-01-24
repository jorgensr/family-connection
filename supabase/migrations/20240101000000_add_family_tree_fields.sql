-- Add new fields to family_members table
ALTER TABLE family_members
  ADD COLUMN family_side VARCHAR DEFAULT 'neutral';

-- Add check constraint for family_side
ALTER TABLE family_members
  ADD CONSTRAINT check_family_side CHECK (family_side IN ('paternal', 'maternal', 'neutral'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_family_members_side ON family_members(family_id, family_side);

-- Drop position-related columns if they exist
DO $$
DECLARE
  col_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'x_position'
  ) INTO col_exists;
  
  IF col_exists THEN
    ALTER TABLE family_members DROP COLUMN x_position;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'y_position'
  ) INTO col_exists;
  
  IF col_exists THEN
    ALTER TABLE family_members DROP COLUMN y_position;
  END IF;
END $$;

-- Drop position-related function if exists
DROP FUNCTION IF EXISTS update_member_positions CASCADE; 