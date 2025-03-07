-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_family_relationship_trigger ON family_relationships;
DROP FUNCTION IF EXISTS validate_family_relationship();

-- Create the validation function
CREATE OR REPLACE FUNCTION validate_family_relationship()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    existing_relationship record;
    is_circular boolean;
BEGIN
    -- Validate relationship type
    IF NEW.relationship_type NOT IN ('child', 'spouse') THEN
        RAISE EXCEPTION 'Invalid relationship type: %', NEW.relationship_type;
    END IF;

    -- Check for existing relationships between these members
    SELECT * INTO existing_relationship
    FROM family_relationships
    WHERE family_id = NEW.family_id
    AND (
        (member1_id = NEW.member1_id AND member2_id = NEW.member2_id) OR
        (member1_id = NEW.member2_id AND member2_id = NEW.member1_id)
    )
    AND id != NEW.id;

    IF FOUND THEN
        RAISE EXCEPTION 'Relationship already exists between these members';
    END IF;

    -- For child relationships, check for circular references
    IF NEW.relationship_type = 'child' THEN
        WITH RECURSIVE ancestry(ancestor_id, descendant_id, depth) AS (
            -- Base case: direct child relationships
            SELECT member1_id, member2_id, 1
            FROM family_relationships
            WHERE relationship_type = 'child'
            AND family_id = NEW.family_id
            UNION ALL
            -- Recursive case: follow the child chain
            SELECT fr.member1_id, a.descendant_id, a.depth + 1
            FROM family_relationships fr
            JOIN ancestry a ON fr.member2_id = a.ancestor_id
            WHERE fr.relationship_type = 'child'
            AND fr.family_id = NEW.family_id
            AND depth < 20
        )
        SELECT EXISTS (
            SELECT 1 FROM ancestry
            WHERE ancestor_id = NEW.member1_id
            AND descendant_id = NEW.member2_id
        ) INTO is_circular;

        IF is_circular THEN
            RAISE EXCEPTION 'This relationship would create a circular reference';
        END IF;
    END IF;

    -- For spouse relationships
    IF NEW.relationship_type = 'spouse' THEN
        IF EXISTS (
            SELECT 1 FROM family_relationships
            WHERE family_id = NEW.family_id
            AND relationship_type = 'spouse'
            AND (member1_id = NEW.member1_id OR member1_id = NEW.member2_id
                OR member2_id = NEW.member1_id OR member2_id = NEW.member2_id)
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'One or both members already have a spouse';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER validate_family_relationship_trigger
BEFORE INSERT OR UPDATE ON family_relationships
FOR EACH ROW
EXECUTE FUNCTION validate_family_relationship(); 