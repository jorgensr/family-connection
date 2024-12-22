import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Separate FamilyMember component with proper React component naming
const FamilyMember = React.memo(({ data }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleProfileClick = (e) => {
    e.stopPropagation();
    navigate(`/family-member/${data.id}`);
  };

  return (
    <div 
      className={`bg-white rounded-xl border-2 ${
        data.relationship === 'self' ? 'border-blue-600' :
        data.relationship === 'spouse' ? 'border-red-500' :
        data.relationship === 'child' ? 'border-green-500' :
        data.relationship === 'parent' ? 'border-purple-500' :
        data.relationship === 'sibling' ? 'border-yellow-500' :
        'border-gray-400'
      } p-4 text-center transform transition-transform duration-200 ${
        isHovered ? 'scale-110 shadow-lg' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="w-16 h-16 mx-auto mb-2 cursor-pointer"
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
            <span className="text-2xl text-gray-600">
              {data.firstName?.[0]}
              {data.lastName?.[0]}
            </span>
          </div>
        )}
      </div>
      <div 
        className="text-sm font-medium cursor-pointer hover:text-blue-600"
        onClick={handleProfileClick}
      >
        {`${data.firstName} ${data.lastName}`}
      </div>
      <div className="text-xs text-gray-500">{data.relationship}</div>
      {data.birthDate && (
        <div className="text-xs text-gray-400 mt-1">
          {new Date(data.birthDate).getFullYear()}
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          data.onAdd();
        }}
        className="mt-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-blue-600 transition-colors"
      >
        +
      </button>
    </div>
  );
});

FamilyMember.displayName = 'FamilyMember';

// Node types configuration
const nodeTypes = {
  familyMember: FamilyMember
};

const EnhancedFamilyTree = ({ familyMembers, relationships, onAddMember }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const processMembers = useCallback(() => {
    console.log('Processing members:', { familyMembers, relationships });
    if (!familyMembers?.length || !relationships?.length) {
      console.log('No members or relationships to process');
      return;
    }

    // Find the root member (self)
    const rootMember = familyMembers.find(member => 
      member.user_id && relationships.some(rel => 
        rel.member1_id === member.id && 
        rel.member2_id === member.id && 
        rel.relationship_type === 'self'
      )
    );

    console.log('Root member found:', rootMember);
    if (!rootMember) {
      console.log('No root member found');
      return;
    }

    const newNodes = [];
    const newEdges = [];
    const processedMembers = new Set();

    const addMemberNode = (member, level, position) => {
      if (processedMembers.has(member.id)) {
        console.log('Member already processed:', member);
        return;
      }
      console.log('Adding member node:', member);
      processedMembers.add(member.id);

      // Find relationship type relative to root
      const relationship = relationships.find(rel => 
        (rel.member1_id === rootMember.id && rel.member2_id === member.id) ||
        (rel.member2_id === rootMember.id && rel.member1_id === member.id)
      );
      console.log('Found relationship:', relationship);

      let relationType = 'unknown';
      if (relationship) {
        if (relationship.member1_id === rootMember.id) {
          relationType = relationship.relationship_type;
        } else {
          // Invert relationship type if needed
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
        draggable: true,
        data: {
          id: member.id,
          firstName: member.first_name,
          lastName: member.last_name,
          imageUrl: member.profile_picture_url,
          relationship: relationType,
          birthDate: member.birth_date,
          onAdd: () => onAddMember(member),
        },
      });

      // Process parents
      const parents = familyMembers.filter(m =>
        relationships.some(rel => 
          rel.member1_id === m.id && 
          rel.member2_id === member.id && 
          rel.relationship_type === 'child'
        )
      );

      console.log('Found parents:', parents);

      parents.forEach((parent, index) => {
        if (!processedMembers.has(parent.id)) {
          const parentX = position.x + (index - (parents.length - 1) / 2) * 250;
          addMemberNode(parent, level - 1, { x: parentX, y: position.y - 250 });
          newEdges.push({
            id: `${parent.id}-${member.id}`,
            source: parent.id,
            target: member.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#800080', strokeWidth: 2 },
          });
        }
      });

      // Process spouse
      const spouseRel = relationships.find(rel => 
        rel.relationship_type === 'spouse' && 
        ((rel.member1_id === member.id || rel.member2_id === member.id))
      );

      if (spouseRel) {
        console.log('Found spouse relationship:', spouseRel);
        const spouse = familyMembers.find(m => 
          m.id === (spouseRel.member1_id === member.id ? spouseRel.member2_id : spouseRel.member1_id)
        );
        if (spouse && !processedMembers.has(spouse.id)) {
          addMemberNode(spouse, level, { x: position.x + 300, y: position.y });
          newEdges.push({
            id: `${member.id}-${spouse.id}`,
            source: member.id,
            target: spouse.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#FF0000', strokeWidth: 2 },
          });
        }
      }

      // Process children
      const children = familyMembers.filter(m =>
        relationships.some(rel => 
          rel.relationship_type === 'child' && 
          rel.member2_id === m.id && 
          rel.member1_id === member.id
        )
      );

      console.log('Found children:', children);

      children.forEach((child, index) => {
        if (!processedMembers.has(child.id)) {
          const childX = position.x + (index - (children.length - 1) / 2) * 250;
          addMemberNode(child, level + 1, { x: childX, y: position.y + 250 });
          newEdges.push({
            id: `${member.id}-${child.id}`,
            source: member.id,
            target: child.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#0000FF', strokeWidth: 2 },
          });
        }
      });

      // Process siblings
      if (level === 0) {
        const siblings = familyMembers.filter(m =>
          relationships.some(rel => 
            rel.relationship_type === 'sibling' && 
            ((rel.member1_id === member.id && rel.member2_id === m.id) ||
             (rel.member2_id === member.id && rel.member1_id === m.id))
          )
        );

        console.log('Found siblings:', siblings);

        siblings.forEach((sibling, index) => {
          if (!processedMembers.has(sibling.id)) {
            const siblingX = position.x - 300 + (index * 200);
            addMemberNode(sibling, level, { x: siblingX, y: position.y });
            newEdges.push({
              id: `${member.id}-${sibling.id}`,
              source: member.id,
              target: sibling.id,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#FFD700', strokeWidth: 2 },
            });
          }
        });
      }
    };

    // Start with root member
    addMemberNode(rootMember, 0, { x: 0, y: 0 });

    console.log('Final nodes and edges:', { nodes: newNodes, edges: newEdges });
    setNodes(newNodes);
    setEdges(newEdges);
  }, [familyMembers, relationships, setNodes, setEdges, onAddMember]);

  useEffect(() => {
    processMembers();
  }, [processMembers]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (!term) {
      processMembers();
      return;
    }

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
  }, [processMembers, setNodes]);

  return (
    <div style={{ width: '100%', height: '80vh' }} className="relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultZoom={1}
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
        <Panel position="top-left" className="bg-white p-2 rounded-lg shadow-lg">
          <input
            type="text"
            placeholder="Search family members..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default EnhancedFamilyTree; 