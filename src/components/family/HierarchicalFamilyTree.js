import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, { 
  Controls,
  Background,
  useReactFlow,
  Panel,
  MarkerType,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FamilyMemberNode } from './FamilyMemberNode';
import { calculateFamilyTreeLayout } from '../../utils/familyTreeLayout';
import { useHotkeys } from 'react-hotkeys-hook';
import FamilyTreeStart from './FamilyTreeStart';

// Constants for layout
const DEFAULT_NODE_SIZE = {
  WIDTH: 200,
  HEIGHT: 100
};

const SPACING = {
  MIN_HORIZONTAL: 20,
  SPOUSE_GAP: 0,
  MIN_VERTICAL: 150
};

// Define edge types and options
const edgeOptions = {
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
  },
  animated: true,
  style: {
    strokeWidth: 2,
    stroke: '#94a3b8'
  }
};

const relationshipColors = {
  spouse: '#ec4899', // pink-500
  parent: '#22c55e', // green-500
  child: '#22c55e', // green-500
  sibling: '#6366f1' // indigo-500
};

const getEdgeStyle = (relationship) => {
  const baseStyle = {
    animated: false,
    strokeWidth: 2,
    strokeDasharray: 'none',
  };

  switch (relationship) {
    case 'parent':
      return {
        ...baseStyle,
        stroke: '#8B5CF6',
        strokeWidth: 3,
        type: 'smoothstep',
      };
    case 'child':
      return {
        ...baseStyle,
        stroke: '#10B981',
        strokeWidth: 3,
        type: 'smoothstep',
      };
    case 'spouse':
      return {
        ...baseStyle,
        stroke: 'transparent', // Make spouse connection invisible
        strokeWidth: 0,
        type: 'straight',
      };
    case 'sibling':
      return {
        ...baseStyle,
        stroke: '#F59E0B',
        strokeWidth: 3,
        type: 'straight',
      };
    default:
      return {
        ...baseStyle,
        stroke: '#9CA3AF',
        strokeWidth: 2,
        type: 'straight',
      };
  }
};

// Create edges helper function
const createEdges = (positions, relationships) => {
  return relationships.map(rel => ({
    id: `${rel.member1_id}-${rel.member2_id}`,
    source: rel.member1_id,
    target: rel.member2_id,
    type: rel.relationship_type === 'spouse' ? 'straight' : 'smoothstep',
    style: getEdgeStyle(rel.relationship_type)
  }));
};

const HierarchicalFamilyTree = ({ 
  familyMembers = [], 
  relationships = [], 
  onAddMember,
  searchQuery 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView, getZoom, setViewport } = useReactFlow();
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Handle profile view navigation
  const handleViewProfile = useCallback((memberId) => {
    navigate(`/family-member/${memberId}`);
  }, [navigate]);

  // Define node types inside component
  const nodeTypes = useMemo(() => ({
    familyMember: FamilyMemberNode
  }), []);

  // Memoize expensive calculations
  const memoizedPositions = useMemo(() => 
    calculateFamilyTreeLayout(familyMembers, relationships),
    [familyMembers, relationships]
  );

  const memoizedNodes = useMemo(() => {
    return memoizedPositions.map(({ member, x, y, isSpouseNode }) => {
      // Find spouse relationship
      const spouseRelationship = relationships.find(rel => 
        rel.relationship_type === 'spouse' && 
        (rel.member1_id === member.id || rel.member2_id === member.id)
      );

      const isSpouse = spouseRelationship !== undefined;
      const spousePosition = isSpouse ? 
        (spouseRelationship.member1_id === member.id ? 'left' : 'right') : 
        undefined;

      // Adjust x position for spouses to be directly adjacent
      let adjustedX = x;
      if (isSpouse) {
        adjustedX = spousePosition === 'left' ? x : x + DEFAULT_NODE_SIZE.WIDTH/250 + SPACING.SPOUSE_GAP/250;
      }

      return {
        id: member.id,
        type: 'familyMember',
        position: { 
          x: adjustedX * 250, 
          y: y * 150 
        },
        data: { 
          member,
          onAdd: onAddMember,
          onViewProfile: handleViewProfile,
          isHighlighted: searchQuery ? 
            `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
            false,
          isSpouse,
          spousePosition
        }
      };
    });
  }, [memoizedPositions, searchQuery, onAddMember, relationships, handleViewProfile]);

  const memoizedEdges = useMemo(() => 
    createEdges(memoizedPositions, relationships),
    [memoizedPositions, relationships]
  );

  const updateNodesAndEdges = useCallback(() => {
    setNodes(memoizedNodes);
    setEdges(memoizedEdges);
    
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [memoizedNodes, memoizedEdges, setNodes, setEdges, fitView]);

  useEffect(() => {
    updateNodesAndEdges();
  }, [updateNodesAndEdges]);

  // Keyboard shortcuts
  useHotkeys('r', () => {
    fitView({ padding: 0.2, duration: 800 });
  }, [fitView]);

  useHotkeys('=', () => {
    const zoom = getZoom();
    setViewport({ zoom: Math.min(zoom + 0.2, 2) }, { duration: 300 });
  }, [getZoom, setViewport]);

  useHotkeys('-', () => {
    const zoom = getZoom();
    setViewport({ zoom: Math.max(zoom - 0.2, 0.1) }, { duration: 300 });
  }, [getZoom, setViewport]);

  // If there are no family members, show the start page
  if (familyMembers.length === 0) {
    return <FamilyTreeStart onStartTree={onAddMember} />;
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={edgeOptions}
        className="bg-gray-50"
      >
        <Background 
          color="#94a3b8" 
          size={2}
          gap={20}
          variant="dots"
        />
        <Controls 
          className="bg-white shadow-lg border-none rounded-lg"
          showInteractive={false}
        />
        <Panel position="bottom-center" className="bg-white rounded-lg shadow-lg p-2 mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {Object.entries(relationshipColors).map(([type, color]) => (
              <div key={type} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-0.5 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default HierarchicalFamilyTree; 