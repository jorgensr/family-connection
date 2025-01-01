// Constants for layout
export const GENERATION_SPACING = 100;
export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 100;
export const SIBLING_SPACING = 50;
export const COUSIN_SPACING = 100;

const SPACING = {
  Y: 2,  // Each generation is 2 units apart on y-axis
  X: 1.5 // Reduce horizontal spacing for better layout
};

// Helper function to get all parents of a member
const getParents = (memberId, relationships) => {
  return relationships
    .filter(rel => 
      // When relationship_type is 'child', member1 is the parent
      (rel.member2_id === memberId && rel.relationship_type === 'child') ||
      // When relationship_type is 'parent', member2 is the parent
      (rel.member1_id === memberId && rel.relationship_type === 'parent')
    )
    .map(rel => rel.relationship_type === 'child' ? rel.member1_id : rel.member2_id);
};

// Helper function to get all children of a member
const getChildren = (memberId, relationships) => {
  return relationships
    .filter(rel => 
      // When relationship_type is 'child', member2 is the child
      (rel.member1_id === memberId && rel.relationship_type === 'child') ||
      // When relationship_type is 'parent', member1 is the child
      (rel.member2_id === memberId && rel.relationship_type === 'parent')
    )
    .map(rel => rel.relationship_type === 'child' ? rel.member2_id : rel.member1_id);
};

// Helper function to get spouse of a member
const getSpouse = (memberId, relationships) => {
  const spouseRel = relationships.find(rel => 
    rel.relationship_type === 'spouse' &&
    (rel.member1_id === memberId || rel.member2_id === memberId)
  );
  return spouseRel ? 
    (spouseRel.member1_id === memberId ? spouseRel.member2_id : spouseRel.member1_id) 
    : null;
};

// Calculate generation number for each member
const calculateGenerations = (members, relationships) => {
  const generations = new Map();
  const processed = new Set();

  // Find the oldest generation (those who have no parents)
  const findRootMembers = () => {
    return members.filter(member => {
      const parents = getParents(member.id, relationships);
      return parents.length === 0;
    });
  };

  const processGeneration = (memberId, generation = 0) => {
    if (processed.has(memberId)) {
      return generations.get(memberId);
    }

    processed.add(memberId);
    generations.set(memberId, generation);

    // Process spouse (same generation)
    const spouseId = getSpouse(memberId, relationships);
    if (spouseId && !processed.has(spouseId)) {
      processGeneration(spouseId, generation);
    }

    // Process children (they go down in generation)
    const children = getChildren(memberId, relationships);
    children.forEach(childId => {
      if (!processed.has(childId)) {
        processGeneration(childId, generation - 1);
        
        // Process child's spouse if exists
        const childSpouseId = getSpouse(childId, relationships);
        if (childSpouseId && !processed.has(childSpouseId)) {
          processGeneration(childSpouseId, generation - 1);
        }
      }
    });

    return generation;
  };

  // Start with the oldest generation
  const rootMembers = findRootMembers();
  console.log('Root members:', rootMembers.map(m => m.first_name));
  
  if (rootMembers.length > 0) {
    rootMembers.forEach(member => {
      processGeneration(member.id, 2); // Start at generation 2 to allow for future older generations
    });
  }

  // Process any remaining members by finding their connection to processed members
  members.forEach(member => {
    if (!processed.has(member.id)) {
      const parents = getParents(member.id, relationships);
      const children = getChildren(member.id, relationships);
      const spouse = getSpouse(member.id, relationships);

      if (parents.length > 0) {
        // If has parents, position one generation below highest parent
        const parentGen = Math.max(...parents
          .map(pid => generations.get(pid))
          .filter(gen => gen !== undefined));
        processGeneration(member.id, parentGen - 1);
      } else if (spouse && generations.has(spouse)) {
        // If has a processed spouse, use same generation
        processGeneration(member.id, generations.get(spouse));
      } else if (children.length > 0) {
        // If has children, position one generation above lowest child
        const childGen = Math.min(...children
          .map(cid => generations.get(cid))
          .filter(gen => gen !== undefined));
        processGeneration(member.id, childGen + 1);
      } else {
        // If no connections, put in middle generation
        processGeneration(member.id, 1);
      }
    }
  });

  return generations;
};

// Calculate x-coordinates for members within each generation
const calculateHorizontalPositions = (members, relationships, generations) => {
  const xPositions = new Map();
  const generationGroups = new Map();

  // Group members by generation
  members.forEach(member => {
    const generation = generations.get(member.id);
    if (!generationGroups.has(generation)) {
      generationGroups.set(generation, []);
    }
    generationGroups.get(generation).push(member);
  });

  // Sort generations from oldest to youngest
  const sortedGenerations = Array.from(generationGroups.keys()).sort((a, b) => b - a);

  // Process each generation
  sortedGenerations.forEach(generation => {
    const generationMembers = generationGroups.get(generation);
    const processed = new Set();

    // First pass: Process couples with children
    generationMembers.forEach(member => {
      if (processed.has(member.id)) return;
      
      const spouseId = getSpouse(member.id, relationships);
      const children = getChildren(member.id, relationships);
      
      if (spouseId && children.length > 0) {
        // Get the center position of children if they're already positioned
        const childPositions = children
          .map(childId => xPositions.get(childId))
          .filter(x => x !== undefined);
        
        if (childPositions.length > 0) {
          const childCenter = childPositions.reduce((a, b) => a + b, 0) / childPositions.length;
          xPositions.set(member.id, childCenter - SPACING.X/2);
          xPositions.set(spouseId, childCenter + SPACING.X/2);
          processed.add(member.id);
          processed.add(spouseId);
        }
      }
    });

    // Second pass: Process single parents
    generationMembers.forEach(member => {
      if (processed.has(member.id)) return;
      
      const children = getChildren(member.id, relationships);
      if (children.length > 0) {
        const childPositions = children
          .map(childId => xPositions.get(childId))
          .filter(x => x !== undefined);
        
        if (childPositions.length > 0) {
          const childCenter = childPositions.reduce((a, b) => a + b, 0) / childPositions.length;
          xPositions.set(member.id, childCenter);
          processed.add(member.id);
        }
      }
    });

    // Third pass: Process remaining couples
    generationMembers.forEach(member => {
      if (processed.has(member.id)) return;

      const spouseId = getSpouse(member.id, relationships);
      if (spouseId && !processed.has(spouseId)) {
        let position = 0;
        while (Array.from(xPositions.values()).includes(position)) {
          position += SPACING.X;
        }
        xPositions.set(member.id, position);
        xPositions.set(spouseId, position + SPACING.X);
        processed.add(member.id);
        processed.add(spouseId);
      }
    });

    // Fourth pass: Process remaining singles
    generationMembers.forEach(member => {
      if (!processed.has(member.id)) {
        let position = 0;
        while (Array.from(xPositions.values()).includes(position)) {
          position += SPACING.X;
        }
        xPositions.set(member.id, position);
        processed.add(member.id);
      }
    });
  });

  // Center all positions around x=0
  const positions = Array.from(xPositions.values());
  const minX = Math.min(...positions);
  const maxX = Math.max(...positions);
  const center = (minX + maxX) / 2;

  xPositions.forEach((pos, id) => {
    xPositions.set(id, pos - center);
  });

  return xPositions;
};

// Main layout functions
export const calculateFamilyTreeLayout = (members, relationships) => {
  if (!members?.length) return [];

  console.log('Starting layout calculation with:', { members, relationships });

  // Calculate generations (y-coordinates)
  const generations = calculateGenerations(members, relationships);
  console.log('Calculated generations:', Object.fromEntries(generations));
  
  // Calculate x-coordinates
  const xPositions = calculateHorizontalPositions(members, relationships, generations);
  console.log('Calculated x positions:', Object.fromEntries(xPositions));

  // Create final positions
  const positions = members.map(member => {
    const pos = {
      member,
      x: xPositions.get(member.id) || 0,
      y: generations.get(member.id) * SPACING.Y || 0
    };
    console.log(`Position for ${member.first_name}:`, pos);
    return pos;
  });

  console.log('Final positions:', positions);
  return positions;
};

export const assignHorizontalPositions = (members, relationships) => {
  // Implementation here
};

export const calculateCoordinates = (members, relationships) => {
  // Implementation here
}; 