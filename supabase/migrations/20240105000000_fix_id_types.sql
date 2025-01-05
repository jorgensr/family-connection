-- Drop existing constraints if they exist
ALTER TABLE IF EXISTS family_relationships
DROP CONSTRAINT IF EXISTS fk_member1,
DROP CONSTRAINT IF EXISTS fk_member2;

-- Add foreign key constraints
ALTER TABLE family_relationships
ADD CONSTRAINT fk_member1 FOREIGN KEY (member1_id) REFERENCES family_members(id),
ADD CONSTRAINT fk_member2 FOREIGN KEY (member2_id) REFERENCES family_members(id); 