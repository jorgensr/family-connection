import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, { 
  Controls,
  Background,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FamilyMemberNode } from './FamilyMemberNode';
import { useHotkeys } from 'react-hotkeys-hook';

// Constants for layout
const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

// Basic edge options
const edgeOptions = {
  type: 'straight',
  animated: false,
  style: {
    strokeWidth: 2,
    stroke: '#94a3b8'
  }
};

const SpouseConnector = ({ data }) => (
  <div style={{ 
    position: 'relative',
    width: '24px', 
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <div style={{
      position: 'absolute',
      fontSize: '24px',
      color: '#ec4899',
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: 999999
    }}>
      ♥
    </div>
  </div>
);

// Add new BiologicalChildrenConnector component
const BiologicalChildrenConnector = ({ data }) => {
  return (
    <div 
      style={{
        width: '2px',
        height: NODE_HEIGHT,
        backgroundColor: '#94a3b8',
        position: 'relative'
      }}
    >
      <Handle
        type="target"
        position="top"
        id="target"
        style={{ opacity: 0 }}
      />
      <Handle
        type="source"
        position="bottom"
        id="source"
        style={{ opacity: 0 }}
      />
    </div>
  );
};

// Add GroupNode component
const GroupNode = ({ data }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      opacity: 0,
      pointerEvents: 'none'
    }}>
      <Handle
        type="source"
        position="bottom"
        id="bottom"
        style={{ opacity: 0 }}
      />
      <Handle
        type="target"
        position="top"
        id="top"
        style={{ opacity: 0 }}
      />
    </div>
  );
};

const HierarchicalFamilyTree = ({ 
  familyMembers = [], 
  relationships = [], 
  onAddMember,
  searchQuery 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Handle profile view navigation
  const handleViewProfile = useCallback((memberId) => {
    navigate(`/family-member/${memberId}`);
  }, [navigate]);

  // Define node types
  const nodeTypes = useMemo(() => ({
    familyMember: FamilyMemberNode,
    spouseConnector: SpouseConnector,
    biologicalChildrenConnector: BiologicalChildrenConnector,
    group: GroupNode
  }), []);

  const calculateLayout = useCallback(() => {
    if (!familyMembers.length) return;

    try {
      // Get container dimensions for initial centering
      const container = containerRef.current;
      const containerWidth = container ? container.offsetWidth : window.innerWidth;
      const containerHeight = container ? container.offsetHeight : window.innerHeight;

      // Calculate total width needed for all members including spouses
      const spouseCount = relationships.filter(rel => rel.relationship_type === 'spouse').length;
      const totalWidth = (familyMembers.length - spouseCount) * NODE_WIDTH + spouseCount * NODE_WIDTH * 2;
      
      // Calculate starting X to center the entire tree
      const startX = (containerWidth - totalWidth) / 2;
      const centerY = (containerHeight - NODE_HEIGHT) / 2;

      // Create relationship maps
      const spouseMap = new Map();
      const childrenMap = new Map(); // Map to store children for each parent

      relationships.forEach(rel => {
        if (rel.relationship_type === 'spouse') {
          spouseMap.set(rel.member1_id, rel.member2_id);
          spouseMap.set(rel.member2_id, rel.member1_id);
        } else if (rel.relationship_type === 'child') {
          // For child relationships, member1 is child and member2 is parent
          const childId = rel.member1_id;
          const parentId = rel.member2_id;
          
          if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, new Set());
          }
          childrenMap.get(parentId).add(childId);
        }
      });

      // Create nodes with proper positioning
      const newNodes = [];
      const newEdges = [];
      const processedSpouses = new Set();
      const processedChildren = new Set();
      let currentX = startX;
      let maxY = centerY;

      familyMembers.forEach((member) => {
        if (!member || !member.id || processedSpouses.has(member.id)) {
          return;
        }

        const spouseId = spouseMap.get(member.id);
        const spouse = spouseId ? familyMembers.find(m => m.id === spouseId) : null;

        if (spouse) {
          processedSpouses.add(member.id);
          processedSpouses.add(spouseId);
          
          const groupId = `group-${member.id}`;
          
          // Add group node first
          newNodes.push({
            id: groupId,
            type: 'group',
            position: { x: currentX, y: centerY },
            style: {
              width: NODE_WIDTH * 2,
              height: NODE_HEIGHT
            },
            data: {
              label: 'group'
            }
          });

          // Add main member node
          newNodes.push({
            id: member.id,
            type: 'familyMember',
            position: { x: 0, y: 0 },
            parentNode: groupId,
            draggable: false,
            data: {
              member,
              onAdd: onAddMember,
              onViewProfile: handleViewProfile,
              isHighlighted: searchQuery ? 
                `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
                false
            }
          });

          // Add heart connector
          newNodes.push({
            id: `${member.id}-connector`,
            type: 'spouseConnector',
            position: { 
              x: NODE_WIDTH - 12,
              y: NODE_HEIGHT/2 - 12
            },
            parentNode: groupId,
            draggable: false,
            zIndex: 999999,
            data: {}
          });

          // Add spouse node
          newNodes.push({
            id: spouseId,
            type: 'familyMember',
            position: { x: NODE_WIDTH, y: 0 },
            parentNode: groupId,
            draggable: false,
            data: {
              member: spouse,
              onAdd: onAddMember,
              onViewProfile: handleViewProfile,
              isHighlighted: searchQuery ? 
                `${spouse.first_name} ${spouse.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
                false
            }
          });

          // Check for children of this couple
          const memberChildren = childrenMap.get(member.id) || new Set();
          const spouseChildren = childrenMap.get(spouseId) || new Set();
          const coupleChildren = new Set([...memberChildren, ...spouseChildren]);

          if (coupleChildren.size > 0) {
            // Add biological children connector
            const connectorId = `${groupId}-children-connector`;
            newNodes.push({
              id: connectorId,
              type: 'biologicalChildrenConnector',
              position: { 
                x: currentX + NODE_WIDTH - 2, // Center under the heart
                y: centerY + NODE_HEIGHT
              },
              draggable: false,
              zIndex: 1,
              data: {}
            });

            // Position children
            const childrenArray = Array.from(coupleChildren);
            const totalChildrenWidth = childrenArray.length * NODE_WIDTH;
            const childStartX = currentX + NODE_WIDTH - (totalChildrenWidth / 2);
            const childY = centerY + NODE_HEIGHT * 2;

            childrenArray.forEach((childId, index) => {
              if (!processedChildren.has(childId)) {
                const child = familyMembers.find(m => m.id === childId);
                if (child) {
                  processedChildren.add(childId);
                  const childX = childStartX + (index * NODE_WIDTH);
                  
                  newNodes.push({
                    id: childId,
                    type: 'familyMember',
                    position: { x: childX, y: childY },
                    draggable: false,
                    data: {
                      member: child,
                      onAdd: onAddMember,
                      onViewProfile: handleViewProfile,
                      isHighlighted: searchQuery ? 
                        `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
                        false
                    }
                  });

                  maxY = Math.max(maxY, childY + NODE_HEIGHT);
                }
              }
            });

            // Add edge from group to biological children connector
            newEdges.push({
              id: `${groupId}-to-${connectorId}`,
              source: groupId,
              target: connectorId,
              sourceHandle: 'bottom',
              targetHandle: 'target',
              type: 'straight',
              style: { stroke: '#94a3b8', strokeWidth: 2 }
            });

            // Add edges from connector to each child
            childrenArray.forEach((childId) => {
              newEdges.push({
                id: `${connectorId}-to-${childId}`,
                source: connectorId,
                target: childId,
                sourceHandle: 'source',
                targetHandle: 'top',
                type: 'straight',
                style: { stroke: '#94a3b8', strokeWidth: 2 }
              });
            });
          }

          currentX += NODE_WIDTH * 2;
        } else {
          // Single member without spouse
          newNodes.push({
            id: member.id,
            type: 'familyMember',
            position: { x: currentX, y: centerY },
            data: {
              member,
              onAdd: onAddMember,
              onViewProfile: handleViewProfile,
              isHighlighted: searchQuery ? 
                `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
                false
            }
          });
          currentX += NODE_WIDTH;
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error('Error calculating layout:', error);
    }
  }, [familyMembers, relationships, onAddMember, handleViewProfile, searchQuery, setNodes, setEdges]);

  // Calculate layout when members change
  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  // Fit view after layout is calculated
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
    }
  }, [nodes, fitView]);

  // Keyboard shortcuts
  useHotkeys('r', () => {
    fitView({ padding: 0.2, duration: 800 });
  }, [fitView]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={edgeOptions}
        fitView
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
      </ReactFlow>
    </div>
  );
};

export default HierarchicalFamilyTree; 