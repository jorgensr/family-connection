import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, { 
  Controls,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FamilyMemberNode } from './FamilyMemberNode';
import { calculateFamilyTreeLayout } from '../../utils/familyTreeLayout';

// Define edge types and options
const edgeOptions = {
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
  },
};

const HierarchicalFamilyTree = ({ familyMembers = [], relationships = [], onAddMember }) => {
  // Define node types inside component
  const nodeTypes = React.useMemo(() => ({
    familyMember: FamilyMemberNode
  }), []);

  console.log('HierarchicalFamilyTree render:', { 
    familyMembersCount: familyMembers.length,
    relationshipsCount: relationships.length,
    nodeTypes,
    FamilyMemberNode
  });

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const createEdges = useCallback((positions) => {
    if (!positions || !relationships) return [];
    
    console.log('Creating edges with positions:', positions);
    console.log('And relationships:', relationships);
    
    const newEdges = [];
    const processedRelationships = new Set();
    
    // Process each relationship
    relationships.forEach((rel) => {
      // Skip if already processed this relationship pair
      const relationshipKey = `${rel.member1_id}-${rel.member2_id}`;
      const reverseKey = `${rel.member2_id}-${rel.member1_id}`;
      if (processedRelationships.has(relationshipKey) || processedRelationships.has(reverseKey)) {
        return;
      }
      
      const source = positions.find(p => p.member.id === rel.member1_id);
      const target = positions.find(p => p.member.id === rel.member2_id);
      
      if (!source?.member || !target?.member) {
        console.log('Missing position for relationship:', {
          type: rel.relationship_type,
          source: source?.member?.first_name,
          target: target?.member?.first_name
        });
        return;
      }

      console.log('Processing relationship:', {
        type: rel.relationship_type,
        source: source.member.first_name,
        target: target.member.first_name
      });

      // Create edge based on relationship type
      if (rel.relationship_type === 'spouse') {
        newEdges.push({
          id: relationshipKey,
          source: source.member.id,
          target: target.member.id,
          type: 'straight',
          style: { stroke: '#FF69B4' },
        });
      } else if (rel.relationship_type === 'parent' || rel.relationship_type === 'child') {
        // Always draw parent -> child (source is parent, target is child)
        const [parentPos, childPos] = rel.relationship_type === 'parent' 
          ? [source, target]
          : [target, source];

        newEdges.push({
          id: `${parentPos.member.id}-${childPos.member.id}`,
          source: parentPos.member.id,
          target: childPos.member.id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { stroke: '#90EE90' },
        });
      }
      
      processedRelationships.add(relationshipKey);
      processedRelationships.add(reverseKey);
    });

    console.log('Created edges:', newEdges);
    return newEdges;
  }, [relationships]);

  // Create coordinate system
  const createCoordinateSystem = useCallback(() => {
    const EXTENT = 1000;
    const GRID_SPACING = 50;
    const gridNodes = [];
    const gridEdges = [];

    // Main axes (thicker, more prominent)
    gridEdges.push(
      {
        id: 'x-axis',
        source: 'x-start',
        target: 'x-end',
        type: 'straight',
        style: { 
          stroke: '#666',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          zIndex: -1
        }
      },
      {
        id: 'y-axis',
        source: 'y-start',
        target: 'y-end',
        type: 'straight',
        style: { 
          stroke: '#666',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          zIndex: -1
        }
      }
    );

    // Grid lines
    for (let i = -EXTENT; i <= EXTENT; i += GRID_SPACING) {
      if (i !== 0) {
        // Grid lines
        gridEdges.push(
          {
            id: `grid-h-${i}`,
            source: `grid-h-${i}-start`,
            target: `grid-h-${i}-end`,
            type: 'straight',
            style: { 
              stroke: '#f0f0f0',
              strokeWidth: 1,
              strokeDasharray: '2,2',
              zIndex: -2
            }
          },
          {
            id: `grid-v-${i}`,
            source: `grid-v-${i}-start`,
            target: `grid-v-${i}-end`,
            type: 'straight',
            style: { 
              stroke: '#f0f0f0',
              strokeWidth: 1,
              strokeDasharray: '2,2',
              zIndex: -2
            }
          }
        );

        // Invisible nodes for grid lines
        gridNodes.push(
          {
            id: `grid-h-${i}-start`,
            position: { x: -EXTENT, y: i },
            type: 'default',
            style: { opacity: 0, width: 1, height: 1 }
          },
          {
            id: `grid-h-${i}-end`,
            position: { x: EXTENT, y: i },
            type: 'default',
            style: { opacity: 0, width: 1, height: 1 }
          },
          {
            id: `grid-v-${i}-start`,
            position: { x: i, y: -EXTENT },
            type: 'default',
            style: { opacity: 0, width: 1, height: 1 }
          },
          {
            id: `grid-v-${i}-end`,
            position: { x: i, y: EXTENT },
            type: 'default',
            style: { opacity: 0, width: 1, height: 1 }
          }
        );
      }
    }

    // Add axis endpoints (invisible)
    gridNodes.push(
      {
        id: 'x-start',
        position: { x: -EXTENT, y: 0 },
        type: 'default',
        style: { opacity: 0, width: 1, height: 1 }
      },
      {
        id: 'x-end',
        position: { x: EXTENT, y: 0 },
        type: 'default',
        style: { opacity: 0, width: 1, height: 1 }
      },
      {
        id: 'y-start',
        position: { x: 0, y: -EXTENT },
        type: 'default',
        style: { opacity: 0, width: 1, height: 1 }
      },
      {
        id: 'y-end',
        position: { x: 0, y: EXTENT },
        type: 'default',
        style: { opacity: 0, width: 1, height: 1 }
      }
    );

    // Add coordinate labels
    const labelStyle = {
      background: 'none',
      border: 'none',
      fontSize: '14px',
      color: '#666',
      width: 'auto',
      height: 'auto',
      zIndex: 1000
    };

    // Add axis labels
    gridNodes.push(
      {
        id: 'x-label-pos',
        position: { x: EXTENT - 50, y: 20 },
        data: { label: 'x+' },
        type: 'default',
        style: labelStyle
      },
      {
        id: 'x-label-neg',
        position: { x: -EXTENT + 30, y: 20 },
        data: { label: 'x-' },
        type: 'default',
        style: labelStyle
      },
      {
        id: 'y-label-pos',
        position: { x: 20, y: -EXTENT + 30 },
        data: { label: 'y+ (older generations)' },
        type: 'default',
        style: labelStyle
      },
      {
        id: 'y-label-neg',
        position: { x: 20, y: EXTENT - 30 },
        data: { label: 'y- (younger generations)' },
        type: 'default',
        style: labelStyle
      },
      {
        id: 'origin',
        position: { x: 20, y: -20 },
        data: { label: '(0,0)' },
        type: 'default',
        style: labelStyle
      }
    );

    return { nodes: gridNodes, edges: gridEdges };
  }, []);

  useEffect(() => {
    // Add safety checks
    if (!Array.isArray(familyMembers) || !Array.isArray(relationships)) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Get coordinate system elements
    const coordinateSystem = createCoordinateSystem();

    console.log('Calculating positions for:', { familyMembers, relationships });

    // Calculate positions using the new layout function
    const positions = calculateFamilyTreeLayout(familyMembers, relationships);
    if (!positions) {
      console.warn('No positions calculated');
      return;
    }

    console.log('Calculated positions:', positions);

    // Create nodes from positions
    const newNodes = positions.map(pos => {
      if (!pos?.member) return null;
      
      // Scale factors for visual spacing
      const VISUAL_SCALE = {
        X: 150,  // Each x unit = 150 pixels
        Y: 150   // Each y unit = 150 pixels
      };

      const scaledPosition = {
        x: pos.x * VISUAL_SCALE.X,
        y: -pos.y * VISUAL_SCALE.Y  // Invert Y so positive is up
      };

      console.log(`Scaled position for ${pos.member.first_name}:`, {
        original: { x: pos.x, y: pos.y },
        scaled: scaledPosition
      });

      return {
        id: pos.member.id,
        type: 'familyMember',
        position: scaledPosition,
        data: { 
          member: pos.member,
          onClick: onAddMember,
          coordinates: `(${pos.x}, ${pos.y})`  // Add coordinate display
        }
      };
    }).filter(Boolean);

    // Create edges
    const newEdges = createEdges(positions);

    // Combine coordinate system with family tree elements
    setNodes([...coordinateSystem.nodes, ...newNodes]);
    setEdges([...coordinateSystem.edges, ...newEdges]);
  }, [familyMembers, relationships, createEdges, onAddMember, createCoordinateSystem]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={edgeOptions}
        minZoom={0.1}
        maxZoom={2}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default HierarchicalFamilyTree; 