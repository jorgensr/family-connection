// Constants for tree layout
const DEFAULT_NODE_SIZE = {
  WIDTH: 200,
  HEIGHT: 100
};

const SPACING = {
  MIN_VERTICAL: 150,    // Increased vertical space between generations
  MIN_HORIZONTAL: 80,   // Increased horizontal space between siblings
  SPOUSE_GAP: 50,       // Increased gap between spouses
  SIBLING_GAP: 100      // Increased gap between sibling groups
};

// Helper class to manage tree node positions
class TreeNode {
  constructor(id, level = 0, x = 0, y = 0) {
    this.id = id;
    this.level = level;
    this.x = x;
    this.y = y;
    this.children = [];
    this.spouse = null;
    this.parents = [];
    this.width = DEFAULT_NODE_SIZE.WIDTH;
    this.height = DEFAULT_NODE_SIZE.HEIGHT;
    this.processed = false; // Add flag to prevent infinite loops
  }
}

export class FamilyTreeLayout {
  constructor() {
    this.nodes = new Map();
    this.levels = new Map();
    this.rootNodes = [];
  }

  validateRelationship(member1Id, member2Id, relationshipType) {
    const member1 = this.nodes.get(member1Id);
    const member2 = this.nodes.get(member2Id);
    
    if (!member1 || !member2) return false;
    
    if (relationshipType === 'parent') {
      return !this.isDescendant(member2, member1);
    }
    
    return true;
  }

  isDescendant(potentialDescendant, ancestor) {
    if (!potentialDescendant || !ancestor) return false;
    
    const visited = new Set(); // Add visited set to prevent circular traversal
    const queue = [potentialDescendant];
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      
      if (current.parents.some(parent => parent.id === ancestor.id)) {
        return true;
      }
      queue.push(...current.parents);
    }
    
    return false;
  }

  initializeTree(members, relationships) {
    // Reset all data structures
    this.nodes.clear();
    this.levels.clear();
    this.rootNodes = [];

    // Create nodes for all members
    members.forEach(member => {
      const node = new TreeNode(member.id);
      this.nodes.set(member.id, node);
    });

    // Process relationships to build tree structure
    relationships.forEach(rel => {
      const { member1_id, member2_id, relationship_type } = rel;
      const node1 = this.nodes.get(member1_id);
      const node2 = this.nodes.get(member2_id);

      if (!this.validateRelationship(member1_id, member2_id, relationship_type)) {
        console.warn(`Invalid relationship detected: ${relationship_type} between ${member1_id} and ${member2_id}`);
        return;
      }

      switch (relationship_type) {
        case 'spouse':
          node1.spouse = node2;
          node2.spouse = node1;
          // Ensure spouses are on the same level
          node2.level = node1.level;
          break;
        case 'parent':
          if (!node2.parents.includes(node1)) {
            node2.parents.push(node1);
          }
          if (!node1.children.includes(node2)) {
            node1.children.push(node2);
          }
          // Set child's level one below parent
          node2.level = node1.level + 1;
          break;
        case 'child':
          if (!node1.children.includes(node2)) {
            node1.children.push(node2);
          }
          if (!node2.parents.includes(node1)) {
            node2.parents.push(node1);
          }
          // Set child's level one below parent
          node2.level = node1.level + 1;
          break;
        default:
          console.warn(`Unknown relationship type: ${relationship_type}`);
          break;
      }
    });

    // Find root nodes (members without parents)
    this.rootNodes = Array.from(this.nodes.values())
      .filter(node => node.parents.length === 0);

    // If no root nodes found, use first member as root
    if (this.rootNodes.length === 0 && members.length > 0) {
      this.rootNodes = [this.nodes.get(members[0].id)];
    }

    return this;
  }

  calculateLayout() {
    const nodes = [];
    const edges = [];
    const processedNodes = new Set();
    let maxNodesPerLevel = new Map();

    // First pass: Calculate levels and count nodes per level
    const queue = this.rootNodes.map(node => ({ node, level: 0 }));
    while (queue.length > 0) {
      const { node, level } = queue.shift();
      if (processedNodes.has(node.id)) continue;
      processedNodes.add(node.id);

      // Update max nodes count for this level
      maxNodesPerLevel.set(level, (maxNodesPerLevel.get(level) || 0) + 1);
      node.level = level;

      // Add spouse to same level
      if (node.spouse && !processedNodes.has(node.spouse.id)) {
        node.spouse.level = level;
        maxNodesPerLevel.set(level, maxNodesPerLevel.get(level) + 1);
        processedNodes.add(node.spouse.id);
      }

      // Add children to next level
      node.children.forEach(child => {
        if (!processedNodes.has(child.id)) {
          queue.push({ node: child, level: level + 1 });
        }
      });
    }

    // Second pass: Calculate x positions based on level width
    processedNodes.clear();
    const levelWidth = new Map();
    maxNodesPerLevel.forEach((count, level) => {
      levelWidth.set(level, count * (DEFAULT_NODE_SIZE.WIDTH + SPACING.MIN_HORIZONTAL));
    });

    // Position nodes
    const positionQueue = [...this.rootNodes];
    let currentLevel = 0;
    let currentX = 0;

    while (positionQueue.length > 0) {
      const node = positionQueue.shift();
      if (processedNodes.has(node.id)) continue;

      // Calculate x position
      if (node.level !== currentLevel) {
        currentLevel = node.level;
        currentX = 0;
      }

      const levelOffset = -levelWidth.get(currentLevel) / 2;
      node.x = levelOffset + currentX;
      node.y = node.level * (DEFAULT_NODE_SIZE.HEIGHT + SPACING.MIN_VERTICAL);
      currentX += DEFAULT_NODE_SIZE.WIDTH + SPACING.MIN_HORIZONTAL;

      // Add node
      nodes.push({
        id: node.id,
        type: 'familyMember',
        position: { x: node.x, y: node.y },
        data: { member: node }
      });

      processedNodes.add(node.id);

      // Handle spouse
      if (node.spouse && !processedNodes.has(node.spouse.id)) {
        node.spouse.x = node.x + DEFAULT_NODE_SIZE.WIDTH + SPACING.SPOUSE_GAP;
        node.spouse.y = node.y;
        
        nodes.push({
          id: node.spouse.id,
          type: 'familyMember',
          position: { x: node.spouse.x, y: node.spouse.y },
          data: { member: node.spouse }
        });

        edges.push({
          id: `${node.id}-${node.spouse.id}`,
          source: node.id,
          target: node.spouse.id,
          type: 'smoothstep',
          data: { relationship: 'spouse' }
        });

        processedNodes.add(node.spouse.id);
      }

      // Add children to queue and create parent-child edges
      node.children.forEach(child => {
        if (!processedNodes.has(child.id)) {
          positionQueue.push(child);
        }
        edges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: 'smoothstep',
          data: { relationship: 'parent' }
        });
      });
    }

    return { nodes, edges };
  }
} 