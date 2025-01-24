import React, { useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Transition } from '@headlessui/react';
import { 
  MagnifyingGlassIcon, 
  ArrowPathIcon, 
  AdjustmentsHorizontalIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const FamilyTreeControls = memo(({ onReset, onSearch, searchQuery, setSearchQuery, showControls, setShowControls }) => {
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  }, [setSearchQuery, onSearch]);

  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);
  }, [setShowControls]);

  const hideControls = useCallback(() => {
    setShowControls(false);
  }, [setShowControls]);

  return (
    <div className="absolute top-4 left-4 z-10 space-y-2">
      <div className="bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search family members..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <button
          onClick={onReset}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          title="Reset view"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
        <button
          onClick={toggleControls}
          className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${showControls ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
          title="Show controls"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        </button>
      </div>

      <Transition
        show={showControls}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Controls</h3>
            <button
              onClick={hideControls}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Pan</span>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">Drag or Arrow Keys</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Zoom</span>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">Scroll or +/-</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Reset View</span>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">R</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
});

FamilyTreeControls.propTypes = {
  onReset: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  showControls: PropTypes.bool.isRequired,
  setShowControls: PropTypes.func.isRequired,
};

FamilyTreeControls.displayName = 'FamilyTreeControls';

export default FamilyTreeControls; 