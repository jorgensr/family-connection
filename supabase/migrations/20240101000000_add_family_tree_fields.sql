-- Add new fields to family_members table
ALTER TABLE family_members
  ADD COLUMN generation_level integer DEFAULT 0,
  ADD COLUMN family_side text DEFAULT 'neutral';

-- Add check constraint for family_side
ALTER TABLE family_members
  ADD CONSTRAINT check_family_side CHECK (family_side IN ('paternal', 'maternal', 'neutral'));

-- Add indices for better query performance
CREATE INDEX idx_family_members_generation ON family_members(family_id, generation_level);
CREATE INDEX idx_family_members_side ON family_members(family_id, family_side);

-- Add constraint to ensure valid generation levels
ALTER TABLE family_members
  ADD CONSTRAINT valid_generation_level CHECK (generation_level >= -5 AND generation_level <= 5);

-- Drop position-related columns
ALTER TABLE family_members
  DROP COLUMN IF EXISTS x_position CASCADE,
  DROP COLUMN IF EXISTS y_position CASCADE;

-- Drop position-related function
DROP FUNCTION IF EXISTS update_member_positions() CASCADE; 