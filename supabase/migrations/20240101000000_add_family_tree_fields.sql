-- Add new fields to family_members table
ALTER TABLE family_members
ADD COLUMN generation_level integer DEFAULT 0,
ADD COLUMN family_side text DEFAULT 'neutral' CHECK (family_side IN ('paternal', 'maternal', 'neutral')),
ADD COLUMN x_position float DEFAULT 0,
ADD COLUMN y_position float DEFAULT 0;

-- Add indices for better query performance
CREATE INDEX idx_family_members_generation ON family_members(family_id, generation_level);
CREATE INDEX idx_family_members_side ON family_members(family_id, family_side);

-- Add constraint to ensure valid generation levels
ALTER TABLE family_members
ADD CONSTRAINT valid_generation_level CHECK (generation_level >= -5 AND generation_level <= 5);

-- Add function to automatically update positions
CREATE OR REPLACE FUNCTION update_member_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate x_position based on family_side and siblings
  -- Calculate y_position based on generation_level
  -- This is a placeholder for now
  NEW.x_position := CASE
    WHEN NEW.family_side = 'paternal' THEN -1
    WHEN NEW.family_side = 'maternal' THEN 1
    ELSE 0
  END;
  
  NEW.y_position := NEW.generation_level::float;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update positions
CREATE TRIGGER member_positions_trigger
BEFORE INSERT OR UPDATE OF family_side, generation_level
ON family_members
FOR EACH ROW
EXECUTE FUNCTION update_member_positions(); 