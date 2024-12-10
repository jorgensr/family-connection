import React, { useState, useEffect, useCallback } from 'react';
import { familyService } from '../services/familyService';
import { useAuth } from '../context/AuthContext';
import AddMemoryForm from '../components/memories/AddMemoryForm';

function FamilyMemories({ familyId }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadMemories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await familyService.getFamilyMemories(familyId);
      setMemories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleAddMemory = async (memoryData) => {
    try {
      await familyService.addFamilyMemory(familyId, memoryData);
      await loadMemories();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center p-4">Loading memories...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Family Memories</h1>
      <AddMemoryForm onSubmit={handleAddMemory} />
      <div className="mt-6 space-y-4">
        {memories.length === 0 ? (
          <div className="text-gray-600">No memories yet. Be the first to add one!</div>
        ) : (
          memories.map((memory) => (
            <div key={memory.id} className="bg-white p-4 rounded shadow">
              {memory.media_url && (
                <img
                  src={memory.media_url}
                  alt={memory.title}
                  className="w-full h-auto mb-2 rounded"
                />
              )}
              <h2 className="text-xl font-semibold text-gray-900">{memory.title}</h2>
              {memory.description && (
                <p className="text-gray-700 mt-2">{memory.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Posted on {new Date(memory.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FamilyMemories;
