import React, { useCallback, useEffect, useRef } from 'react';
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

  // Define node types inside component
  const nodeTypes = React.useMemo(() => ({
    familyMember: FamilyMemberNode
  }), []);

  const createEdges = useCallback((positions) => {
    if (!positions || !relationships) return [];
    
    const newEdges = [];
    const processedRelationships = new Set();
    
    relationships.forEach((rel) => {
      const relationshipKey = `${rel.member1_id}-${rel.member2_id}`;
      const reverseKey = `${rel.member2_id}-${rel.member1_id}`;
      
      if (processedRelationships.has(relationshipKey) || processedRelationships.has(reverseKey)) {
        return;
      }
      
      const source = positions.find(p => p.member.id === rel.member1_id);
      const target = positions.find(p => p.member.id === rel.member2_id);
      
      if (!source?.member || !target?.member) return;

      const baseEdgeStyle = {
        ...edgeOptions.style,
        stroke: relationshipColors[rel.relationship_type] || edgeOptions.style.stroke,
        opacity: searchQuery ? 0.3 : 1
      };

      if (rel.relationship_type === 'spouse') {
        newEdges.push({
          id: relationshipKey,
          source: source.member.id,
          target: target.member.id,
          type: 'straight',
          style: {
            ...baseEdgeStyle,
            strokeDasharray: '5,5'
          },
          animated: false
        });
      } else if (rel.relationship_type === 'parent' || rel.relationship_type === 'child') {
        const [parentPos, childPos] = rel.relationship_type === 'parent' 
          ? [source, target]
          : [target, source];

        newEdges.push({
          id: `${parentPos.member.id}-${childPos.member.id}`,
          source: parentPos.member.id,
          target: childPos.member.id,
          type: 'smoothstep',
          markerEnd: edgeOptions.markerEnd,
          style: baseEdgeStyle,
          animated: true
        });
      }
      
      processedRelationships.add(relationshipKey);
      processedRelationships.add(reverseKey);
    });

    return newEdges;
  }, [relationships, searchQuery]);

  const updateNodesAndEdges = useCallback(() => {
    const positions = calculateFamilyTreeLayout(familyMembers, relationships);
    
    const newNodes = positions.map(({ member, x, y }) => ({
      id: member.id,
      type: 'familyMember',
      position: { x: x * 250, y: y * 150 },
      data: { 
        member,
        onAdd: onAddMember,
        isHighlighted: searchQuery ? 
          `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
          false
      }
    }));

    const newEdges = createEdges(positions);
    
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Center the view after a short delay to ensure nodes are rendered
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [familyMembers, relationships, createEdges, setNodes, setEdges, fitView, searchQuery, onAddMember]);

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