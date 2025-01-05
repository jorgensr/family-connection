-- Drop existing functions
DROP FUNCTION IF EXISTS add_family_relationship(uuid, uuid, uuid, uuid, text);
DROP FUNCTION IF EXISTS add_family_relationships(family_relationship_record[]);

-- Create function to add a single family relationship
CREATE OR REPLACE FUNCTION add_family_relationship(
  p_id uuid,
  p_family_id uuid,
  p_member1_id uuid,
  p_member2_id uuid,
  p_relationship_type text
) RETURNS void AS $$
BEGIN
  -- Validate relationship type
  IF p_relationship_type NOT IN ('parent', 'child', 'spouse') THEN
    RAISE EXCEPTION 'Invalid relationship type: %', p_relationship_type;
  END IF;

  -- Validate UUIDs
  IF p_id IS NULL OR p_family_id IS NULL OR p_member1_id IS NULL OR p_member2_id IS NULL THEN
    RAISE EXCEPTION 'All IDs must be valid UUIDs';
  END IF;

  -- Validate members belong to the same family
  IF NOT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id
    AND id IN (p_member1_id, p_member2_id)
    HAVING COUNT(*) = 2
  ) THEN
    RAISE EXCEPTION 'Both members must belong to the specified family';
  END IF;

  -- Insert the relationship (trigger will handle validation)
  INSERT INTO family_relationships (id, family_id, member1_id, member2_id, relationship_type)
  VALUES (p_id, p_family_id, p_member1_id, p_member2_id, p_relationship_type);

  -- For parent-child relationships, automatically create the reciprocal relationship
  IF p_relationship_type IN ('parent', 'child') THEN
    INSERT INTO family_relationships (
      id,
      family_id,
      member1_id,
      member2_id,
      relationship_type
    )
    VALUES (
      uuid_generate_v4(),
      p_family_id,
      p_member2_id,
      p_member1_id,
      CASE p_relationship_type
        WHEN 'parent' THEN 'child'
        WHEN 'child' THEN 'parent'
      END
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to add multiple family relationships
CREATE OR REPLACE FUNCTION add_family_relationships(
  relationships family_relationship_record[]
) RETURNS void AS $$
DECLARE
  r family_relationship_record;
BEGIN
  -- Validate relationship types and UUIDs
  IF EXISTS (
    SELECT 1 FROM unnest(relationships) r
    WHERE r.relationship_type NOT IN ('parent', 'child', 'spouse')
       OR r.id IS NULL
       OR r.family_id IS NULL
       OR r.member1_id IS NULL
       OR r.member2_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid relationship data found';
  END IF;

  -- Process each relationship individually to ensure proper validation
  FOREACH r IN ARRAY relationships
  LOOP
    PERFORM add_family_relationship(r.id, r.family_id, r.member1_id, r.member2_id, r.relationship_type);
  END LOOP;
END;
$$ LANGUAGE plpgsql; 