import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import PropTypes from 'prop-types';
import InviteMemberModal from './InviteMemberModal';

// Custom edge component with interactive features
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isHovered, setIsHovered] = useState(false);

  const getEdgeStyle = () => {
    const baseStyle = {
      ...style,
      transition: 'all 0.3s ease',
      animation: data?.isNew ? 'drawLine 1s ease forwards' : 'none',
    };

    if (isHovered) {
      return {
        ...baseStyle,
        strokeWidth: (style.strokeWidth || 2) + 1,
        filter: 'brightness(1.2)',
      };
    }

    return baseStyle;
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={getEdgeStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          if (data?.onClick) {
            data.onClick(id);
          }
        }}
      />
      {isHovered && data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: 12,
              pointerEvents: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

// Add CSS animation for new edges
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes drawLine {
    0% {
      stroke-dashoffset: 100%;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }
`;
document.head.appendChild(styleSheet);

// Separate FamilyMember component with proper React component naming
const FamilyMember = React.memo(({ data }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleProfileClick = (e) => {
    e.stopPropagation();
    navigate(`/family-member/${data.id}`);
  };

  return (
    <>
      <div 
        className={`bg-white rounded-xl border-2 ${
          data.relationship === 'self' ? 'border-blue-600' :
          data.relationship === 'spouse' ? 'border-red-500' :
          data.relationship === 'child' ? 'border-green-500' :
          data.relationship === 'parent' ? 'border-purple-500' :
          data.relationship === 'sibling' ? 'border-yellow-500' :
          'border-gray-400'
        } p-5 text-center transform transition-all duration-200 min-w-[180px] ${
          isHovered ? 'scale-105 shadow-lg' : 'shadow-md'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Handle
          type="target"
          position={Position.Top}
          id={`${data.id}-top`}
          style={{ background: '#8B5CF6', width: '8px', height: '8px', top: '-5px' }}
        />
        
        <Handle
          type="source"
          position={Position.Left}
          id={`${data.id}-left`}
          style={{ background: '#F59E0B', width: '8px', height: '8px', left: '-5px' }}
        />
        
        <Handle
          type="source"
          position={Position.Right}
          id={`${data.id}-right`}
          style={{ background: '#EF4444', width: '8px', height: '8px', right: '-5px' }}
        />
        
        <Handle
          type="source"
          position={Position.Bottom}
          id={`${data.id}-bottom`}
          style={{ background: '#10B981', width: '8px', height: '8px', bottom: '-5px' }}
        />

        <div className="flex flex-col items-center space-y-3">
          <div 
            className="w-20 h-20 mx-auto cursor-pointer"
            onClick={handleProfileClick}
          >
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt={`${data.firstName} ${data.lastName}`}
                className="w-full h-full rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className={`w-full h-full rounded-full flex items-center justify-center ${
                data.relationship === 'self' ? 'bg-blue-100' :
                data.relationship === 'spouse' ? 'bg-red-100' :
                data.relationship === 'child' ? 'bg-green-100' :
                data.relationship === 'parent' ? 'bg-purple-100' :
                data.relationship === 'sibling' ? 'bg-yellow-100' :
                'bg-gray-200'
              }`}>
                <span className="text-3xl font-medium text-gray-600">
                  {data.firstName?.[0]}
                  {data.lastName?.[0]}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center space-y-1">
            <div 
              className="text-base font-medium cursor-pointer hover:text-blue-600"
              onClick={handleProfileClick}
            >
              {`${data.firstName} ${data.lastName}`}
            </div>
            <div className="text-sm text-gray-500">{data.relationship}</div>
            {data.birthDate && (
              <div className="text-sm text-gray-400">
                {new Date(data.birthDate).getFullYear()}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onAdd();
              }}
              className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-blue-600 transition-colors"
            >
              +
            </button>
            
            {!data.is_claimed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInviteModal(true);
                }}
                className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-green-600 transition-colors"
                title="Invite to claim profile"
              >
                ✉
              </button>
            )}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          member={{
            id: data.id,
            first_name: data.firstName,
            last_name: data.lastName
          }}
        />
      )}
    </>
  );
});

FamilyMember.displayName = 'FamilyMember';

// Node types configuration
const nodeTypes = {
  familyMember: FamilyMember,
};

// Edge types configuration
const edgeTypes = {
  custom: CustomEdge,
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
        stroke: '#EF4444',
        strokeWidth: 3,
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

const EnhancedFamilyTree = React.memo(({ familyMembers, relationships, onAddMember }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  console.log('EnhancedFamilyTree render:', { 
    familyMembersCount: familyMembers?.length,
    relationshipsCount: relationships?.length,
    nodesCount: nodes.length,
    edgesCount: edges.length
  });

  const processMembers = useCallback(() => {
    if (!familyMembers?.length || !relationships?.length) {
      console.log('No family members or relationships to process');
      return;
    }

    if (isProcessing) {
      console.log('Already processing members');
      return;
    }

    setIsProcessing(true);

    try {
      // Find the root member (self)
      let rootMember = familyMembers.find(member => 
        relationships.some(rel => 
          rel.member1_id === member.id && 
          rel.member2_id === member.id && 
          rel.relationship_type === 'self'
        )
      );

      console.log('Root member:', rootMember);

      if (!rootMember && familyMembers.length > 0) {
        rootMember = familyMembers[0];
        console.log('Using first member as root:', rootMember);
      }

      if (!rootMember) {
        console.log('No root member found');
        return;
      }

      const newNodes = [];
      const newEdges = [];
      const processedMembers = new Set();
      
      // Adjust spacing constants
      const VERTICAL_SPACING = 250;     // Increased from 200
      const HORIZONTAL_SPACING = 300;   // Increased from 250
      const SIBLING_SPACING = 350;      // Increased from 280
      const SPOUSE_SPACING = 300;       // New constant for spouse spacing
      const INITIAL_X = window.innerWidth / 2;
      const INITIAL_Y = 150;           // Increased from 100

      const addMemberNode = (member, level, position, relationToParent = null) => {
        if (processedMembers.has(member.id)) {
          return;
        }
        processedMembers.add(member.id);

        // Find relationship type relative to root
        const relationship = relationships.find(rel => 
          (rel.member1_id === rootMember.id && rel.member2_id === member.id) ||
          (rel.member2_id === rootMember.id && rel.member1_id === member.id)
        );

        let relationType = relationToParent || 'unknown';
        if (relationship) {
          if (relationship.member1_id === rootMember.id) {
            relationType = relationship.relationship_type;
          } else {
            switch (relationship.relationship_type) {
              case 'child': relationType = 'parent'; break;
              case 'parent': relationType = 'child'; break;
              case 'spouse': relationType = 'spouse'; break;
              case 'sibling': relationType = 'sibling'; break;
              default: relationType = relationship.relationship_type;
            }
          }
        }

        newNodes.push({
          id: member.id,
          type: 'familyMember',
          position,
          data: {
            id: member.id,
            firstName: member.first_name,
            lastName: member.last_name,
            imageUrl: member.profile_picture_url,
            relationship: relationType,
            birthDate: member.birth_date,
            is_claimed: member.is_claimed,
            onAdd: () => onAddMember(member),
          },
        });

        // Process parents first
        const parents = familyMembers.filter(m =>
          relationships.some(rel => 
            rel.member1_id === m.id && 
            rel.member2_id === member.id && 
            rel.relationship_type === 'child'
          )
        );

        parents.forEach((parent, index) => {
          if (!processedMembers.has(parent.id)) {
            const parentX = position.x + (index - (parents.length - 1) / 2) * HORIZONTAL_SPACING;
            const parentY = position.y - VERTICAL_SPACING;
            addMemberNode(parent, level - 1, { x: parentX, y: parentY }, 'parent');
            
            newEdges.push({
              id: `${parent.id}-${member.id}`,
              source: parent.id,
              target: member.id,
              sourceHandle: `${parent.id}-bottom`,
              targetHandle: `${member.id}-top`,
              type: 'straight',
              style: getEdgeStyle('parent'),
              data: { label: 'Parent' },
            });
          }
        });

        // Process siblings to the left
        const siblings = familyMembers.filter(m =>
          relationships.some(rel => 
            rel.relationship_type === 'sibling' && 
            ((rel.member1_id === member.id && rel.member2_id === m.id) ||
             (rel.member2_id === member.id && rel.member1_id === m.id))
          )
        );

        siblings.forEach((sibling, index) => {
          if (!processedMembers.has(sibling.id)) {
            const siblingX = position.x - SIBLING_SPACING;
            addMemberNode(sibling, level, { x: siblingX, y: position.y }, 'sibling');
            
            newEdges.push({
              id: `${member.id}-${sibling.id}`,
              source: member.id,
              target: sibling.id,
              sourceHandle: `${member.id}-left`,
              targetHandle: `${sibling.id}-right`,
              type: 'straight',
              style: getEdgeStyle('sibling'),
              data: { label: 'Sibling' },
              animated: false,
            });
          }
        });

        // Process spouse to the right
        const spouseRel = relationships.find(rel => 
          rel.relationship_type === 'spouse' && 
          (rel.member1_id === member.id || rel.member2_id === member.id)
        );

        if (spouseRel) {
          const spouse = familyMembers.find(m => 
            m.id === (spouseRel.member1_id === member.id ? spouseRel.member2_id : spouseRel.member1_id)
          );
          if (spouse && !processedMembers.has(spouse.id)) {
            const spouseX = position.x + SPOUSE_SPACING;
            addMemberNode(spouse, level, { x: spouseX, y: position.y }, 'spouse');
            
            newEdges.push({
              id: `${member.id}-${spouse.id}`,
              source: member.id,
              target: spouse.id,
              sourceHandle: `${member.id}-right`,
              targetHandle: `${spouse.id}-left`,
              type: 'straight',
              style: getEdgeStyle('spouse'),
              data: { label: 'Spouse' },
            });
          }
        }

        // Process children below
        const children = familyMembers.filter(m =>
          relationships.some(rel => 
            rel.relationship_type === 'child' && 
            rel.member2_id === m.id && 
            rel.member1_id === member.id
          )
        );

        children.forEach((child, index) => {
          if (!processedMembers.has(child.id)) {
            const childX = position.x + (index - (children.length - 1) / 2) * HORIZONTAL_SPACING;
            const childY = position.y + VERTICAL_SPACING;
            addMemberNode(child, level + 1, { x: childX, y: childY }, 'child');
            
            newEdges.push({
              id: `${member.id}-${child.id}`,
              source: member.id,
              target: child.id,
              sourceHandle: `${member.id}-bottom`,
              targetHandle: `${child.id}-top`,
              type: 'straight',
              style: getEdgeStyle('child'),
              data: { label: 'Child' },
            });
          }
        });
      };

      // Start with root member at center
      addMemberNode(rootMember, 0, { x: INITIAL_X, y: INITIAL_Y }, 'self');

      console.log('Processed tree:', {
        nodes: newNodes.length,
        edges: newEdges.length,
        processedMembers: processedMembers.size
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } finally {
      setIsProcessing(false);
    }
  }, [familyMembers, relationships, setNodes, setEdges, onAddMember, isProcessing]);

  // Reset search when members change
  useEffect(() => {
    setSearchTerm('');
  }, [familyMembers]);

  // Process members when they change
  useEffect(() => {
    console.log('Processing members effect triggered');
    processMembers();
  }, [processMembers]);

  // Add handleSearch function
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (!term) {
      // Reset node visibility
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          style: { ...node.style, opacity: 1 }
        }))
      );
      return;
    }

    // Filter nodes based on search term
    setNodes((nds) =>
      nds.map((node) => {
        const matches = 
          node.data.firstName.toLowerCase().includes(term.toLowerCase()) ||
          node.data.lastName.toLowerCase().includes(term.toLowerCase());
        return {
          ...node,
          style: {
            ...node.style,
            opacity: matches ? 1 : 0.2,
          },
        };
      })
    );
  }, [setNodes]);

  return (
    <div style={{ width: '100%', height: '100%' }} className="relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        zoomOnScroll={false}
        panOnScroll={true}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        attributionPosition="bottom-left"
        fitViewOptions={{ 
          padding: 0.2,
          includeHiddenNodes: true,
          minZoom: 0.5,
          maxZoom: 1.5
        }}
        style={{ background: 'transparent' }}
        onInit={() => {
          console.log('ReactFlow initialized');
        }}
        onError={(error) => {
          console.error('ReactFlow error:', error);
        }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          className="bg-white shadow-lg rounded-lg border border-gray-200"
        />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data.relationship) {
              case 'self': return '#3B82F6';
              case 'spouse': return '#EF4444';
              case 'child': return '#10B981';
              case 'parent': return '#8B5CF6';
              case 'sibling': return '#F59E0B';
              default: return '#9CA3AF';
            }
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
          className="bg-white shadow-lg rounded-lg border border-gray-200"
        />
        <Background variant="dots" gap={12} size={1} />
        <Panel position="top-left" className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search family members..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </Panel>
        {selectedEdge && (
          <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg">
            <h3 className="font-bold mb-2">Relationship Details</h3>
            <p>{selectedEdge.data.label} Relationship</p>
            <button
              onClick={() => setSelectedEdge(null)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
});

EnhancedFamilyTree.displayName = 'EnhancedFamilyTree';

EnhancedFamilyTree.propTypes = {
  familyMembers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    first_name: PropTypes.string.isRequired,
    last_name: PropTypes.string.isRequired,
    birth_date: PropTypes.string,
    profile_picture_url: PropTypes.string,
  })).isRequired,
  relationships: PropTypes.arrayOf(PropTypes.shape({
    member1_id: PropTypes.string.isRequired,
    member2_id: PropTypes.string.isRequired,
    relationship_type: PropTypes.string.isRequired,
  })).isRequired,
  onAddMember: PropTypes.func.isRequired,
};

export default EnhancedFamilyTree; 