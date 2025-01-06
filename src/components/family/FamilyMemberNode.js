import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

export function FamilyMemberNode({ data }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const { member, onAdd, isHighlighted } = data;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    navigate(`/family-member/${member.id}`);
  };

  const nodeVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    hover: { scale: 1.05 },
    highlighted: { scale: 1.05, boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)' }
  };

  const detailsVariants = {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 }
  };

  return (
    <>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <motion.div
        className={`relative rounded-lg shadow-lg transition-colors
          ${isHighlighted ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-white hover:bg-gray-50'}
          ${showDetails ? 'min-w-[280px]' : 'min-w-[200px]'}`}
        initial="initial"
        animate="animate"
        whileHover="hover"
        variants={nodeVariants}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={handleProfileClick}
            >
              {member.profile_picture_url ? (
                <img
                  src={member.profile_picture_url}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = null;
                    e.target.parentElement.innerHTML = `<div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span class="text-blue-600 font-medium text-lg">${getInitials(member.first_name, member.last_name)}</span>
                    </div>`;
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-lg">
                    {getInitials(member.first_name, member.last_name)}
                  </span>
                </div>
              )}
            </div>
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={handleProfileClick}
            >
              <h3 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                {member.first_name} {member.last_name}
              </h3>
              {member.birth_date && (
                <p className="text-xs text-gray-500">
                  Age: {getAge(member.birth_date)}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              {showDetails ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={detailsVariants}
                className="mt-4 space-y-3 overflow-hidden"
              >
                {member.birth_date && (
                  <div className="text-sm">
                    <span className="text-gray-500">Birth Date:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(member.birth_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {member.gender && (
                  <div className="text-sm">
                    <span className="text-gray-500">Gender:</span>
                    <span className="ml-2 text-gray-900 capitalize">
                      {member.gender}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between space-x-2">
                    <button
                      onClick={handleProfileClick}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      <UserCircleIcon className="h-4 w-4 mr-1" />
                      View Profile
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdd(member);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Relative
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isHovered && !showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-md shadow-lg p-1 flex space-x-1"
            >
              <button
                onClick={handleProfileClick}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="View profile"
              >
                <UserCircleIcon className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(member);
                }}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Add relative"
              >
                <PlusIcon className="h-4 w-4 text-gray-600" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </>
  );
}
