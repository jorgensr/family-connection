import React from 'react';
import { Handle } from 'reactflow';
import { useNavigate } from 'react-router-dom';

// Define component as a named function for better debugging
function FamilyMemberNode({ data }) {
  const { member, onClick, coordinates } = data;
  const initials = `${member.first_name[0]}${member.last_name[0]}`;
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate(`/family-member/${member.id}`);
  };
  
  return (
    <div 
      className="family-member-node"
      style={{
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '120px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative'
      }}
    >
      <div 
        onClick={handleProfileClick}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: member.gender === 'male' ? '#E3F2FD' : '#FCE4EC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 8px',
          fontSize: '16px',
          color: member.gender === 'male' ? '#1565C0' : '#C2185B',
          cursor: 'pointer'
        }}
      >
        {initials}
      </div>
      <div 
        onClick={handleProfileClick}
        style={{ 
          fontWeight: 'bold', 
          marginBottom: '4px',
          cursor: 'pointer',
          '&:hover': {
            textDecoration: 'underline'
          }
        }}
      >
        {member.first_name} {member.last_name}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        {member.birth_year}
      </div>
      {coordinates && (
        <div style={{ 
          fontSize: '10px', 
          color: '#999', 
          marginTop: '4px',
          borderTop: '1px dashed #eee',
          paddingTop: '4px'
        }}>
          {coordinates}
        </div>
      )}
      <button
        className="nodrag" // Prevents dragging when clicking the button
        onClick={(e) => {
          e.stopPropagation();
          onClick(member);
        }}
        style={{
          position: 'absolute',
          right: '-10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        +
      </button>
      
      {/* Add connection handles */}
      <Handle type="target" position="top" style={{ opacity: 0 }} />
      <Handle type="source" position="bottom" style={{ opacity: 0 }} />
      <Handle type="target" position="left" style={{ opacity: 0 }} />
      <Handle type="source" position="right" style={{ opacity: 0 }} />
    </div>
  );
}

// Export as both default and named export
export { FamilyMemberNode };
export default FamilyMemberNode;