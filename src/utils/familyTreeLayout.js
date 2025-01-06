// Constants for layout
export const GENERATION_SPACING = 100;
export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 100;
export const SIBLING_SPACING = 50;
export const COUSIN_SPACING = 100;
export const SPOUSE_GAP = 0.05; // Very tiny gap to allow hearts to overlap

// Main layout functions
export const calculateFamilyTreeLayout = (members, relationships) => {
  const positions = [];
  const processedMembers = new Set();
  
  const findSpouse = (memberId) => {
    return relationships.find(rel => 
      rel.relationship_type === 'spouse' && 
      (rel.member1_id === memberId || rel.member2_id === memberId)
    );
  };

  const processNode = (member, level = 0, horizontalOffset = 0) => {
    if (processedMembers.has(member.id)) return horizontalOffset;
    processedMembers.add(member.id);

    // Find spouse relationship
    const spouseRel = findSpouse(member.id);
    const hasSpouse = spouseRel !== undefined;
    
    // Add current member
    positions.push({
      member,
      x: horizontalOffset,
      y: level,
      isSpouseNode: hasSpouse
    });

    let nextOffset = horizontalOffset + (hasSpouse ? SPOUSE_GAP : 1);

    // Process spouse immediately after if exists
    if (hasSpouse && !processedMembers.has(spouseRel.member2_id)) {
      const spouseId = spouseRel.member1_id === member.id ? 
        spouseRel.member2_id : spouseRel.member1_id;
      const spouse = members.find(m => m.id === spouseId);
      
      if (spouse) {
        positions.push({
          member: spouse,
          x: horizontalOffset + SPOUSE_GAP,
          y: level,
          isSpouseNode: true
        });
        processedMembers.add(spouse.id);
        nextOffset = horizontalOffset + 1; // Full spacing after the spouse pair
      }
    }

    // Find and process children
    const childRelationships = relationships.filter(rel => 
      (rel.relationship_type === 'parent' && rel.member1_id === member.id) ||
      (rel.relationship_type === 'child' && rel.member2_id === member.id)
    );

    if (childRelationships.length > 0) {
      const childrenIds = childRelationships.map(rel => 
        rel.relationship_type === 'parent' ? rel.member2_id : rel.member1_id
      );
      
      const children = members.filter(m => childrenIds.includes(m.id));
      
      children.forEach(child => {
        nextOffset = processNode(child, level + 1, nextOffset);
      });
    }

    return nextOffset;
  };

  // Start with root members (those without parents)
  const rootMembers = members.filter(member => {
    const hasParent = relationships.some(rel => 
      (rel.relationship_type === 'parent' && rel.member2_id === member.id) ||
      (rel.relationship_type === 'child' && rel.member1_id === member.id)
    );
    return !hasParent;
  });

  let currentOffset = 0;
  rootMembers.forEach(root => {
    currentOffset = processNode(root, 0, currentOffset);
  });

  return positions;
};

export const assignHorizontalPositions = (members, relationships) => {
  // Implementation here
};

export const calculateCoordinates = (members, relationships) => {
  // Implementation here
}; 