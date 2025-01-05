-- Create a type for relationship records
CREATE TYPE family_relationship_record AS (
  id uuid,
  family_id uuid,
  member1_id uuid,
  member2_id uuid,
  relationship_type text
);

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

  INSERT INTO family_relationships (id, family_id, member1_id, member2_id, relationship_type)
  VALUES (
    p_id,
    p_family_id,
    p_member1_id,
    p_member2_id,
    p_relationship_type
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to add multiple family relationships
CREATE OR REPLACE FUNCTION add_family_relationships(
  relationships family_relationship_record[]
) RETURNS void AS $$
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

  INSERT INTO family_relationships (id, family_id, member1_id, member2_id, relationship_type)
  SELECT 
    r.id,
    r.family_id,
    r.member1_id,
    r.member2_id,
    r.relationship_type
  FROM unnest(relationships) r;
END;
$$ LANGUAGE plpgsql; 