import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
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
import { ChevronDoubleDownIcon, ChevronDoubleUpIcon } from '@heroicons/react/24/outline';

// Constants for layout
const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const HORIZONTAL_SPACING = 20;
const COUPLE_WIDTH = NODE_WIDTH * 2;
const BASE_GENERATION_GAP = 120; // Base vertical gap between generations
const GENERATION_SPACING_INCREASE = 20; // Additional spacing per generation depth
const CONNECTOR_HEIGHT = 40;
const MIN_GROUP_SPACING = 40; // Minimum spacing between family groups

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
const BiologicalChildrenConnector = ({ data, onToggleCollapse, isCollapsed }) => {
  return (
    <div 
      style={{
        width: '2px',
        height: isCollapsed ? '24px' : NODE_HEIGHT, // Give some height for the button when collapsed
        backgroundColor: isCollapsed ? 'transparent' : '#94a3b8',
        position: 'relative'
      }}
    >
      <Handle
        type="target"
        position="top"
        id="target"
        style={{ opacity: 0 }}
      />
      {!isCollapsed && (
      <Handle
        type="source"
        position="bottom"
        id="source"
        style={{ opacity: 0 }}
      />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCollapse();
        }}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 p-1 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
        title={isCollapsed ? "Expand children" : "Collapse children"}
      >
        {isCollapsed ? (
          <ChevronDoubleDownIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDoubleUpIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>
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

// Add helper function for calculating generation-based spacing
const getGenerationSpacing = (generation) => {
  return BASE_GENERATION_GAP + (generation * GENERATION_SPACING_INCREASE);
};

const HierarchicalFamilyTree = ({ 
  familyMembers = [], 
  relationships = [], 
  onAddMember,
  searchQuery 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const { fitView } = useReactFlow();
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Handle profile view navigation
  const handleViewProfile = useCallback((memberId) => {
    navigate(`/family-member/${memberId}`);
  }, [navigate]);

  // Add collapse/expand handler
  const handleToggleCollapse = useCallback((nodeId) => {
    setCollapsedNodes(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(nodeId)) {
        newCollapsed.delete(nodeId);
      } else {
        newCollapsed.add(nodeId);
      }
      return newCollapsed;
    });
  }, []);

  // Update nodeTypes with collapse functionality
  const nodeTypes = useMemo(() => ({
    familyMember: (props) => (
      <FamilyMemberNode 
        {...props}
      />
    ),
    spouseConnector: SpouseConnector,
    biologicalChildrenConnector: (props) => (
      <BiologicalChildrenConnector 
        {...props}
        onToggleCollapse={() => handleToggleCollapse(props.data.parentId)}
        isCollapsed={collapsedNodes.has(props.data.parentId)}
      />
    ),
    group: GroupNode
  }), [handleToggleCollapse, collapsedNodes]);

  const calculateLayout = useCallback(() => {
    if (!familyMembers.length) return;

    try {
      console.log('Starting layout calculation:', {
        familyMembersCount: familyMembers.length,
        relationshipsCount: relationships.length
      });

      // Get container dimensions for initial centering
      const container = containerRef.current;
      const containerWidth = container ? container.offsetWidth : window.innerWidth;

      // Create relationship maps
      const spouseMap = new Map();
      const childrenMap = new Map();
      const parentMap = new Map(); // Track who are parents
      const generationLevelMap = new Map(); // Track generation levels
      const familyBranchMap = new Map(); // Track family branches

      // First pass: Build relationship maps
      relationships.forEach(rel => {
        if (rel.relationship_type === 'spouse') {
          spouseMap.set(rel.member1_id, rel.member2_id);
          spouseMap.set(rel.member2_id, rel.member1_id);
        } else if (rel.relationship_type === 'parent') {
          const parentId = rel.member1_id;
          const childId = rel.member2_id;
          
          if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, new Set());
          }
          childrenMap.get(parentId).add(childId);
          parentMap.set(childId, true); // Keep existing parent tracking

          // Track family branches
          if (!familyBranchMap.has(parentId)) {
            familyBranchMap.set(parentId, new Set([parentId]));
          }
          familyBranchMap.get(parentId).add(childId);
        }
      });

      // Second pass: Calculate generation levels
      const calculateGenerations = (memberId, level = 0) => {
        generationLevelMap.set(memberId, level);
        
        // Process spouse at same generation
        const spouseId = spouseMap.get(memberId);
        if (spouseId) {
          generationLevelMap.set(spouseId, level);
        }

        // Process children at next generation
        const children = childrenMap.get(memberId) || new Set();
        children.forEach(childId => {
          if (!generationLevelMap.has(childId)) {
            calculateGenerations(childId, level + 1);
          }
        });
      };

      // Start generation calculation from root members
      const rootMembers = familyMembers.filter(m => !parentMap.has(m.id));
      rootMembers.forEach(member => calculateGenerations(member.id));

      // Log relationship information for debugging
      console.log('Family structure:', {
        spouseCount: spouseMap.size / 2,
        childrenCount: Array.from(childrenMap.values()).reduce((acc, set) => acc + set.size, 0),
        generationCount: new Set(generationLevelMap.values()).size,
        rootMembersCount: rootMembers.length
      });

      // Calculate total width needed for root level members
      const spouseCount = relationships.filter(rel => 
        rel.relationship_type === 'spouse' && 
        !parentMap.has(rel.member1_id)
      ).length;

      const totalWidth = (rootMembers.length - spouseCount) * NODE_WIDTH + 
                        spouseCount * COUPLE_WIDTH + 
                        (rootMembers.length - 1) * HORIZONTAL_SPACING;
      
      const startX = (containerWidth - totalWidth) / 2;
      const startY = 50; // Start higher on the page

      const newNodes = [];
      const newEdges = [];
      const processedSpouses = new Set();
      const processedChildren = new Set();
      let currentX = startX;
      let maxY = startY;

      // Only process root level members in the main loop
      rootMembers.forEach((member) => {
        if (!member || !member.id || processedSpouses.has(member.id)) {
          return;
        }

        const spouseId = spouseMap.get(member.id);
        const spouse = spouseId ? familyMembers.find(m => m.id === spouseId) : null;

        console.log('Processing member:', {
          memberId: member.id,
          name: `${member.first_name} ${member.last_name}`,
          hasSpouse: Boolean(spouse),
          spouseId,
          currentX
        });
        
        if (spouse) {
          processedSpouses.add(member.id);
          processedSpouses.add(spouseId);

          const groupId = `group-${member.id}`;

          // Add group node first
          newNodes.push({
            id: groupId,
            type: 'group',
            position: { x: currentX, y: maxY },
            style: {
              width: COUPLE_WIDTH,
              height: NODE_HEIGHT
            },
            data: {
              label: 'group'
            }
          });

          // Add main member node with hasChildren flag
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
              hasChildren: (childrenMap.get(member.id)?.size > 0) || false,
              isHighlighted: searchQuery ? 
                `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
                false
            }
          });

          // Keep existing spouse connector positioning
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

          // Add spouse node with hasChildren flag
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
              hasChildren: (childrenMap.get(spouseId)?.size > 0) || false,
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
            // Calculate center position for the biological connector
            const groupCenterX = currentX + NODE_WIDTH; // Center of the couple's group
            const connectorY = maxY + NODE_HEIGHT;

            // Add biological children connector
            const connectorId = `${groupId}-children-connector`;
            newNodes.push({
              id: connectorId,
              type: 'biologicalChildrenConnector',
              position: { 
                x: groupCenterX,
                y: connectorY
              },
              draggable: false,
              zIndex: 1,
              data: {
                parentId: member.id
              }
            });

            // Only add children and edges if not collapsed
            if (!collapsedNodes.has(member.id) && !collapsedNodes.has(spouseId)) {
              const childrenArray = Array.from(coupleChildren);
              const childrenWithSpouses = childrenArray.filter(childId => spouseMap.has(childId));
              const singleChildren = childrenArray.filter(childId => !spouseMap.has(childId));
              
              // Calculate total width needed with better spacing
              const totalChildrenWidth = calculateGroupWidth([...childrenWithSpouses, ...singleChildren], spouseMap);
              
              // Center children under parent with minimum spacing
              const startChildX = Math.max(
                groupCenterX - (totalChildrenWidth / 2),
                HORIZONTAL_SPACING // Ensure minimum left margin
              );
              
              // Calculate generation-based vertical spacing
              const generation = generationLevelMap.get(member.id) || 0;
              const childY = connectorY + CONNECTOR_HEIGHT + getGenerationSpacing(generation + 1);
              
              let currentChildX = startChildX;

              // Process children with spouses first
              childrenWithSpouses.forEach(childId => {
                if (!processedChildren.has(childId)) {
                  const child = familyMembers.find(m => m.id === childId);
                  if (child) {
                    processedChildren.add(childId);
                    
                    // Calculate child position
                    const childX = currentChildX;
                    const childSpouseId = spouseMap.get(childId);
                    const childSpouse = childSpouseId ? familyMembers.find(m => m.id === childSpouseId) : null;

                    if (childSpouse && !processedSpouses.has(childSpouseId)) {
                      // Create a group for the child and their spouse
                      const childGroupId = `group-${childId}`;
                      processedSpouses.add(childSpouseId);
                      
                      // Add group node
                      newNodes.push({
                        id: childGroupId,
                        type: 'group',
                        position: { x: childX, y: childY },
                        style: {
                          width: COUPLE_WIDTH,
                          height: NODE_HEIGHT
                        },
                        data: { label: 'group' }
                      });

                      // Add child node in group
                      newNodes.push({
                        id: childId,
                        type: 'familyMember',
                        position: { x: 0, y: 0 },
                        parentNode: childGroupId,
                        draggable: false,
                        data: {
                          member: child,
                          onAdd: onAddMember,
                          onViewProfile: handleViewProfile,
                          hasChildren: (childrenMap.get(childId)?.size > 0) || false,
                          isHighlighted: searchQuery ? 
                            `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
                            false
                        }
                      });

                      // Add spouse connector
                      newNodes.push({
                        id: `${childId}-connector`,
                        type: 'spouseConnector',
                        position: { x: NODE_WIDTH - 12, y: NODE_HEIGHT/2 - 12 },
                        parentNode: childGroupId,
                        draggable: false,
                        zIndex: 999999,
                        data: {}
                      });

                      // Add spouse node
                      newNodes.push({
                        id: childSpouseId,
                        type: 'familyMember',
                        position: { x: NODE_WIDTH, y: 0 },
                        parentNode: childGroupId,
                        draggable: false,
                        data: {
                          member: childSpouse,
                          onAdd: onAddMember,
                          onViewProfile: handleViewProfile,
                          hasChildren: (childrenMap.get(childSpouseId)?.size > 0) || false,
                          isHighlighted: searchQuery ? 
                            `${childSpouse.first_name} ${childSpouse.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
                            false
                        }
                      });

                      // Process grandchildren if they exist
                      const childChildren = childrenMap.get(childId) || new Set();
                      const spouseChildren = childrenMap.get(childSpouseId) || new Set();
                      const grandchildren = new Set([...childChildren, ...spouseChildren]);

                      if (grandchildren.size > 0 && !collapsedNodes.has(childId)) {
                        const childConnectorId = `${childGroupId}-children-connector`;
                        const childConnectorY = childY + NODE_HEIGHT;

                        // Add connector for grandchildren
                        newNodes.push({
                          id: childConnectorId,
                          type: 'biologicalChildrenConnector',
                          position: { 
                            x: NODE_WIDTH,
                            y: childConnectorY
                          },
                          draggable: false,
                          zIndex: 1,
                          data: {
                            parentId: childId
                          }
                        });

                        // Add edge from child group to connector
                        newEdges.push({
                          id: `${childGroupId}-to-${childConnectorId}`,
                          source: childGroupId,
                          target: childConnectorId,
                          sourceHandle: 'bottom',
                          targetHandle: 'target',
                          type: 'straight',
                          style: { stroke: '#94a3b8', strokeWidth: 2 }
                        });

                        // Position grandchildren
                        const grandchildrenArray = Array.from(grandchildren);
                        const totalGrandchildrenWidth = calculateGroupWidth(grandchildrenArray, spouseMap);
                        const startGrandchildX = childX + NODE_WIDTH - (totalGrandchildrenWidth / 2);
                        const grandchildGeneration = generationLevelMap.get(childId) || 0;
                        const grandchildY = childConnectorY + NODE_HEIGHT + getGenerationSpacing(grandchildGeneration + 1);

                        grandchildrenArray.forEach((grandchildId, gIndex) => {
                          if (!processedChildren.has(grandchildId)) {
                            const grandchild = familyMembers.find(m => m.id === grandchildId);
                            if (grandchild) {
                              processedChildren.add(grandchildId);
                              
                              const grandchildX = startGrandchildX + (gIndex * NODE_WIDTH);
                              
                              // Add grandchild node
                              newNodes.push({
                                id: grandchildId,
                                type: 'familyMember',
                                position: { 
                                  x: grandchildX,
                                  y: grandchildY
                                },
                                draggable: false,
                                data: {
                                  member: grandchild,
                                  onAdd: onAddMember,
                                  onViewProfile: handleViewProfile,
                                  hasChildren: (childrenMap.get(grandchildId)?.size > 0) || false,
                                  isHighlighted: searchQuery ? 
                                    `${grandchild.first_name} ${grandchild.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
                                    false
                                }
                              });

                              // Add edge from connector to grandchild
                              newEdges.push({
                                id: `${childConnectorId}-to-${grandchildId}`,
                                source: childConnectorId,
                                target: grandchildId,
                                sourceHandle: 'source',
                                targetHandle: 'top',
                                type: 'straight',
                                style: { stroke: '#94a3b8', strokeWidth: 2 }
                              });

                              maxY = Math.max(maxY, grandchildY + NODE_HEIGHT);
                            }
                          }
                        });
                      }

                      currentChildX += COUPLE_WIDTH + Math.max(HORIZONTAL_SPACING, MIN_GROUP_SPACING);
                    }
                  }
                }
              });

              // Then process single children
              singleChildren.forEach(childId => {
                if (!processedChildren.has(childId)) {
                  const child = familyMembers.find(m => m.id === childId);
                  if (child) {
                    processedChildren.add(childId);
                    
                    // Add single child node
                    newNodes.push({
                      id: childId,
                      type: 'familyMember',
                      position: { 
                        x: currentChildX,
                        y: childY
                      },
                      draggable: false,
                      data: {
                        member: child,
                        onAdd: onAddMember,
                        onViewProfile: handleViewProfile,
                        hasChildren: (childrenMap.get(childId)?.size > 0) || false,
                        isHighlighted: searchQuery ? 
                          `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) :
                          false
                      }
                    });

                    currentChildX += NODE_WIDTH + Math.max(HORIZONTAL_SPACING, MIN_GROUP_SPACING);
                  }
                }
              });

              // Add edges after all nodes are created
              newEdges.push({
                id: `${groupId}-to-${connectorId}`,
                source: groupId,
                target: connectorId,
                sourceHandle: 'bottom',
                targetHandle: 'target',
                type: 'straight',
                style: { stroke: '#94a3b8', strokeWidth: 2 }
              });

              childrenArray.forEach((childId) => {
                if (!spouseMap.has(childId)) {
                  // Only add direct edges for single children
                  newEdges.push({
                    id: `${connectorId}-to-${childId}`,
                    source: connectorId,
                    target: childId,
                    sourceHandle: 'source',
                    targetHandle: 'top',
                    type: 'straight',
                    style: { stroke: '#94a3b8', strokeWidth: 2 }
                  });
                } else {
                  // For married children, connect directly to the child node, not the group
                  newEdges.push({
                    id: `${connectorId}-to-${childId}`,
                    source: connectorId,
                    target: childId,
                    sourceHandle: 'source',
                    targetHandle: 'top',
                    type: 'straight',
                    style: { stroke: '#94a3b8', strokeWidth: 2 }
                  });
                }
              });
            }
          }

          currentX += NODE_WIDTH * 2 + HORIZONTAL_SPACING; // Keep existing spacing between family groups
        } else {
          // Single member without spouse - add hasChildren flag
          newNodes.push({
            id: member.id,
            type: 'familyMember',
            position: { x: currentX, y: maxY },
            data: {
              member,
              onAdd: onAddMember,
              onViewProfile: handleViewProfile,
              hasChildren: (childrenMap.get(member.id)?.size > 0) || false,
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
  }, [familyMembers, relationships, onAddMember, handleViewProfile, searchQuery, collapsedNodes, setNodes, setEdges]);

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

  // Calculate total width with better spacing for large groups
  const calculateGroupWidth = (members, spouseMap) => {
    let width = 0;
    let count = 0;
    members.forEach(memberId => {
      if (spouseMap.has(memberId)) {
        width += COUPLE_WIDTH;
      } else {
        width += NODE_WIDTH;
      }
      count++;
    });
    // Add spacing between members
    if (count > 1) {
      width += (count - 1) * Math.max(HORIZONTAL_SPACING, MIN_GROUP_SPACING);
    }
    return width;
  };

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