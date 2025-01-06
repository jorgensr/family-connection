// src/services/familyService.js
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

// Helper function to validate generation level
const validateGenerationLevel = (level) => {
  return Math.max(-5, Math.min(5, level)); // Clamp between -5 and 5
};

// Helper function to get member's generation level
const getMemberGenerationLevel = async (familyId, memberId) => {
  try {
    // If memberId is not a UUID, return 0 as it's likely a preview member
    if (!memberId || typeof memberId !== 'string' || !memberId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return 0;
    }

    const { data, error } = await supabase
      .from('family_members')
      .select('generation_level')
      .eq('id', memberId)
      .single();

    if (error) {
      console.error('Error getting member generation level:', error);
      return 0;
    }

    return data?.generation_level || 0;
  } catch (error) {
    console.error('Error in getMemberGenerationLevel:', error);
    return 0;
  }
};

// Helper function to determine generation level
const determineGenerationLevel = async (familyId, memberId, relationships) => {
  // Root member (first added) is generation 0
  if (!relationships || relationships.length === 0) return 0;

  // Get all relationships for this member
  const memberRelations = relationships.filter(rel => 
    rel.member1_id === memberId || rel.member2_id === memberId
  );

  // If member has parents, they are one generation below their parents
  const parentRelation = memberRelations.find(rel =>
    rel.relationship_type === 'child' && rel.member1_id === memberId
  );

  if (parentRelation) {
    try {
      const parentLevel = await getMemberGenerationLevel(familyId, parentRelation.member2_id);
      return validateGenerationLevel(parentLevel - 1);
    } catch (error) {
      console.error('Error getting parent generation level:', error);
      return 0;
    }
  }

  // If member has children, they are one generation above their children
  const childRelation = memberRelations.find(rel =>
    rel.relationship_type === 'parent' && rel.member1_id === memberId
  );

  if (childRelation) {
    try {
      const childLevel = await getMemberGenerationLevel(familyId, childRelation.member2_id);
      return validateGenerationLevel(childLevel + 1);
    } catch (error) {
      console.error('Error getting child generation level:', error);
      return 0;
    }
  }

  // If no relationships found, check if this is a spouse
  const spouseRelation = memberRelations.find(rel =>
    rel.relationship_type === 'spouse'
  );

  if (spouseRelation) {
    try {
      const spouseId = spouseRelation.member1_id === memberId ? spouseRelation.member2_id : spouseRelation.member1_id;
      const spouseLevel = await getMemberGenerationLevel(familyId, spouseId);
      return spouseLevel;
    } catch (error) {
      console.error('Error getting spouse generation level:', error);
      return 0;
    }
  }

  return 0;
};

// Helper function to get root family member
const getRootFamilyMember = async (familyId) => {
  try {
    // If familyId is not a UUID, return null as it's likely a preview member
    if (!familyId || typeof familyId !== 'string' || !familyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return null;
    }

    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error('Error getting root family member:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getRootFamilyMember:', error);
    return null;
  }
};

// Helper function to get family member
const getFamilyMember = async (memberId) => {
  try {
    // If memberId is not a UUID, return null as it's likely a preview member
    if (!memberId || typeof memberId !== 'string' || !memberId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return null;
    }

    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) {
      console.error('Error getting family member:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getFamilyMember:', error);
    return null;
  }
};

// Helper function to check family line connection
const checkFamilyLineConnection = async (familyId, memberId, side, relationships, visited = new Set()) => {
  try {
    // If memberId is not a UUID, return false as it's likely a preview member
    if (!memberId || typeof memberId !== 'string' || !memberId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return false;
    }

    if (visited.has(memberId)) return false;
    visited.add(memberId);

    const memberRelations = relationships.filter(rel => 
      rel.member1_id === memberId || rel.member2_id === memberId
    );

    for (const relation of memberRelations) {
      const relatedMemberId = relation.member1_id === memberId ? relation.member2_id : relation.member1_id;
      
      try {
        const relatedMember = await getFamilyMember(relatedMemberId);
        if (!relatedMember) continue;

        if (relatedMember.family_side === side) return true;
        if (await checkFamilyLineConnection(familyId, relatedMemberId, side, relationships, visited)) return true;
      } catch (error) {
        console.error(`Error getting related member ${relatedMemberId}:`, error);
        continue;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking family line connection:', error);
    return false;
  }
};

// Helper function to determine family side (maternal/paternal)
const determineFamilySide = async (familyId, memberId, relationships) => {
  try {
    // Root member is neutral
    if (!relationships || relationships.length === 0) return 'neutral';

    // If memberId is not a UUID, return neutral as it's likely a preview member
    if (!memberId || typeof memberId !== 'string' || !memberId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return 'neutral';
    }

    // Get all relationships for this member
    const memberRelations = relationships.filter(rel => 
      rel.member1_id === memberId || rel.member2_id === memberId
    );

    // Find connection to root member through relationships
    const rootMember = await getRootFamilyMember(familyId);
    if (!rootMember) return 'neutral';

    // If this is a spouse of the root, they're neutral
    const isSpouse = memberRelations.some(rel =>
      rel.relationship_type === 'spouse' &&
      (rel.member1_id === rootMember.id || rel.member2_id === rootMember.id)
    );

    if (isSpouse) return 'neutral';

    // Check paternal line
    const paternalConnection = await checkFamilyLineConnection(familyId, memberId, 'paternal', relationships);
    if (paternalConnection) return 'paternal';

    // Check maternal line
    const maternalConnection = await checkFamilyLineConnection(familyId, memberId, 'maternal', relationships);
    if (maternalConnection) return 'maternal';

    return 'neutral';
  } catch (error) {
    console.error('Error determining family side:', error);
    return 'neutral';
  }
};

// Helper function to infer relationships
const inferRelationships = async (familyId, newMember, directRelation) => {
  const inferredRelations = [];
  
  try {
    // Validate familyId is a UUID
    if (!familyId || typeof familyId !== 'string' || !familyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid family ID');
    }

    // Validate relationship type
    if (!directRelation.relationship_type || !['parent', 'child', 'spouse'].includes(directRelation.relationship_type)) {
      throw new Error('Invalid relationship type');
    }

    // Get all existing family members and relationships
    const { data: existingMembers, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId);

    if (membersError) {
      console.error('Error getting existing members:', membersError);
      return inferredRelations;
    }

    const { data: existingRelations, error: relationsError } = await supabase
      .from('family_relationships')
      .select('*')
      .eq('family_id', familyId);

    if (relationsError) {
      console.error('Error getting existing relationships:', relationsError);
      return inferredRelations;
    }

    // If adding a child, also connect to the parent's spouse
    if (directRelation.relationship_type === 'child') {
      const parentSpouse = existingMembers.find(member =>
        existingRelations.some(rel =>
          rel.relationship_type === 'spouse' &&
          ((rel.member1_id === directRelation.member1_id && rel.member2_id === member.id) ||
           (rel.member2_id === directRelation.member1_id && rel.member1_id === member.id))
        )
      );

      if (parentSpouse) {
        inferredRelations.push({
          id: uuidv4(),
          family_id: familyId,
          member1_id: parentSpouse.id,
          member2_id: newMember.id,
          relationship_type: 'parent'
        });
      }
    }

    // Infer parent-child relationships if spouse relationship is being added
    if (directRelation.relationship_type === 'spouse') {
      const spouseChildren = existingMembers.filter(member =>
        existingRelations.some(rel =>
          rel.relationship_type === 'child' &&
          rel.member1_id === directRelation.member2_id &&
          rel.member2_id === member.id
        )
      );

      spouseChildren.forEach(child => {
        inferredRelations.push({
          id: uuidv4(),
          family_id: familyId,
          member1_id: newMember.id,
          member2_id: child.id,
          relationship_type: 'parent'
        });
      });
    }

    return inferredRelations;
  } catch (error) {
    console.error('Error inferring relationships:', error);
    return inferredRelations;
  }
};

const logPerformance = (methodName, startTime) => {
  const duration = performance.now() - startTime;
  console.debug(`${methodName} took ${duration.toFixed(2)}ms`);
};

// Function to preview member addition
const previewMemberAddition = async (newMember) => {
  const startTime = performance.now();
  try {
    // Validate familyId is a UUID
    if (!newMember.familyId || typeof newMember.familyId !== 'string' || !newMember.familyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid family ID');
    }

    // If there's a related member, validate its ID is a UUID
    if (newMember.relatedMemberId && (typeof newMember.relatedMemberId !== 'string' || !newMember.relatedMemberId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i))) {
      throw new Error('Invalid related member ID');
    }

    // Create a mock member object for inference
    const mockMember = {
      id: uuidv4(),
      family_id: newMember.familyId,
      first_name: newMember.firstName,
      last_name: newMember.lastName,
      birth_date: newMember.birthDate,
      generation_level: 0,
      family_side: 'neutral',
      x_position: 0,
      y_position: 0
    };

    // Get existing relationships to determine generation level and family side
    const { data: existingRelations } = await supabase
      .from('family_relationships')
      .select('*')
      .eq('family_id', newMember.familyId);

    // Use the helper functions to determine generation level and family side
    const generationLevel = await determineGenerationLevel(
      newMember.familyId,
      newMember.relatedMemberId,
      existingRelations || []
    );

    const familySide = await determineFamilySide(
      newMember.familyId,
      newMember.relatedMemberId,
      existingRelations || []
    );

    // Update mock member with calculated values
    mockMember.generation_level = generationLevel;
    mockMember.family_side = familySide;

    // Ensure relationship type is lowercase and valid
    const relationshipType = newMember.relationshipType.toLowerCase();
    if (!['parent', 'child', 'spouse'].includes(relationshipType)) {
      throw new Error('Invalid relationship type');
    }

    // Create the direct relationship
    const directRelation = {
      id: uuidv4(),
      family_id: newMember.familyId,
      member1_id: newMember.relatedMemberId,
      member2_id: mockMember.id,
      relationship_type: relationshipType
    };

    // Infer relationships
    const inferredRelations = await inferRelationships(
      newMember.familyId,
      mockMember,
      directRelation
    );

    // Return preview data
    logPerformance('previewMemberAddition', startTime);
    return {
      member: mockMember,
      directRelation,
      inferredRelations
    };
  } catch (error) {
    console.error('Error in previewMemberAddition:', error);
    throw error;
  }
};

// Update addFamilyMember function to include performance monitoring
const addFamilyMember = async (newMember) => {
  const startTime = performance.now();
  try {
    // Validate familyId is a UUID
    if (!newMember.familyId || typeof newMember.familyId !== 'string' || !newMember.familyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid family ID');
    }

    // If there's a related member, validate its ID is a UUID
    if (newMember.relatedMemberId && (typeof newMember.relatedMemberId !== 'string' || !newMember.relatedMemberId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i))) {
      throw new Error('Invalid related member ID');
    }

    // Get existing relationships to determine generation level and family side
    const { data: existingRelations, error: relationsError } = await supabase
      .from('family_relationships')
      .select('*')
      .eq('family_id', newMember.familyId);

    if (relationsError) throw relationsError;

    // Use the helper functions to determine generation level and family side
    const generationLevel = await determineGenerationLevel(
      newMember.familyId,
      newMember.relatedMemberId,
      existingRelations || []
    );

    const familySide = await determineFamilySide(
      newMember.familyId,
      newMember.relatedMemberId,
      existingRelations || []
    );

    // Create new member with UUID
    const memberId = uuidv4();
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .insert([{
        id: memberId,
        family_id: newMember.familyId,
        first_name: newMember.firstName,
        last_name: newMember.lastName,
        birth_date: newMember.birthDate,
        profile_picture_url: newMember.profilePictureUrl,
        generation_level: generationLevel,
        family_side: familySide,
        gender: newMember.gender
      }])
      .select()
      .single();

    if (memberError) throw memberError;

    // Create the direct relationship if there's a related member
    if (newMember.relatedMemberId) {
      // Ensure relationship type is lowercase and valid
      const relationshipType = newMember.relationshipType.toLowerCase();
      if (!['parent', 'child', 'spouse'].includes(relationshipType)) {
        throw new Error('Invalid relationship type');
      }

      const directRelation = {
        id: uuidv4(),
        family_id: newMember.familyId,
        member1_id: newMember.relatedMemberId,
        member2_id: member.id,
        relationship_type: relationshipType
      };

      // Add direct relationship using stored procedure
      const { error: relationError } = await supabase.rpc('add_family_relationship', {
        p_id: directRelation.id,
        p_family_id: directRelation.family_id,
        p_member1_id: directRelation.member1_id,
        p_member2_id: directRelation.member2_id,
        p_relationship_type: directRelation.relationship_type
      });

      if (relationError) throw relationError;

      // Infer and add additional relationships
      const inferredRelations = await inferRelationships(
        newMember.familyId,
        member,
        directRelation
      );

      if (inferredRelations.length > 0) {
        // Add inferred relationships using stored procedure
        const inferredWithIds = inferredRelations.map(rel => ({
          id: uuidv4(),
          ...rel
        }));

        const { error: inferredError } = await supabase.rpc('add_family_relationships', {
          relationships: inferredWithIds
        });

        if (inferredError) throw inferredError;
      }

      return {
        member,
        directRelation,
        inferredRelations
      };
    }

    return { member };
  } catch (error) {
    console.error('Error adding family member:', error);
    throw error;
  } finally {
    logPerformance('addFamilyMember', startTime);
  }
};

// Create the familyService object
export const familyService = {
  addFamilyMember,
  previewMemberAddition,
  inferRelationships,
  getFamilyMember,

  async addFirstFamilyMember(familyId, memberData) {
    try {
      // Validate familyId is a UUID
      if (!familyId || typeof familyId !== 'string' || !familyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        throw new Error('Invalid family ID');
      }

      // Validate userId is a UUID if provided
      if (memberData.userId && (typeof memberData.userId !== 'string' || !memberData.userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i))) {
        throw new Error('Invalid user ID');
      }

      // Create the first member with UUID
      const memberId = uuidv4();
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .insert([{
          id: memberId,
          family_id: familyId,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          birth_date: memberData.birthDate,
          profile_picture_url: memberData.profilePictureUrl,
          bio: memberData.bio,
          user_id: memberData.userId,
          is_claimed: true, // Mark as claimed since this is the user's own profile
          generation_level: 0, // Root member is at generation 0
          family_side: 'neutral', // Root member is neutral
          gender: memberData.gender || 'unknown',
          x_position: 0, // Center position horizontally
          y_position: 0  // Center position vertically
        }])
        .select()
        .single();

      if (memberError) {
        console.error('Error adding first family member:', memberError);
        throw memberError;
      }

      return member;
    } catch (error) {
      console.error('Error in addFirstFamilyMember:', error);
      throw error;
    }
  },

  async getOrCreateFamily(name) {
    try {
      // Get user ID once
      const userId = (await supabase.auth.getUser()).data.user.id;

      // First check if user already has a family
      const { data: existingFamilies, error: fetchError } = await supabase
        .from('families')
        .select('*')
        .eq('created_by', userId)
        .limit(1);

      if (fetchError) throw fetchError;

      // If family exists, return it
      if (existingFamilies && existingFamilies.length > 0) {
        return existingFamilies[0];
      }

      // If no family exists, create one
      const { data: family, error } = await supabase
        .from('families')
        .insert([{ 
          name: name,
          created_by: userId 
        }])
        .select()
        .single();
      
      if (error) throw error;
      return family;
    } catch (error) {
      console.error('Error in getOrCreateFamily:', error);
      throw error;
    }
  },

  async getFamilyMembers(familyId) {
    const startTime = performance.now();
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*, user_id, is_claimed')
        .eq('family_id', familyId);

      if (error) throw error;
      logPerformance('getFamilyMembers', startTime);
      return data || [];
    } catch (error) {
      console.error('Error in getFamilyMembers:', error);
      throw error;
    }
  },

  async getFamilyRelationships(familyId) {
    const startTime = performance.now();
    try {
      const { data, error } = await supabase
        .from('family_relationships')
        .select('*')
        .eq('family_id', familyId);

      if (error) throw error;
      logPerformance('getFamilyRelationships', startTime);
      return data || [];
    } catch (error) {
      console.error('Error in getFamilyRelationships:', error);
      throw error;
    }
  },

  async getFamilyIdForMember(memberId) {
    if (!memberId) throw new Error('Member ID is required');

    const { data, error } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('id', memberId)
      .single();

    if (error) throw error;
    return data.family_id;
  },

  async getMemberMemories(memberId) {
    try {
      const { data, error } = await supabase
        .from('family_memories')
        .select('*')
        .eq('family_member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getMemberMemories:', error);
      throw error;
    }
  },

  async verifyInviteToken(token) {
    try {
      // First check if token exists and is not expired
      const { data: member, error } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('invite_token', token)
        .single();

      if (error) throw new Error('Invalid invite token');
      if (!member) throw new Error('Member not found');

      // Check if token is expired
      const now = new Date();
      const expirationDate = new Date(member.invite_token_expires_at);
      if (now > expirationDate) {
        throw new Error('Invite token has expired');
      }

      // Check if already claimed
      if (member.is_claimed) {
        throw new Error('This profile has already been claimed');
      }

      return member;
    } catch (error) {
      console.error('Error verifying invite token:', error);
      throw error;
    }
  },

  async updateFamilyMemberByInviteToken(inviteToken, userId) {
    try {
      // First verify the token
      const member = await this.verifyInviteToken(inviteToken);

      // Update the member record
      const { error: updateError } = await supabase
        .from('family_members')
        .update({
          user_id: userId,
          is_claimed: true,
          invite_token: null,
          invite_token_expires_at: null,
          invite_email: null,
          claimed_at: new Date().toISOString()
        })
        .eq('id', member.id);

      if (updateError) throw updateError;

      // Get the updated member record with family details
      const { data: updatedMember, error: fetchError } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('id', member.id)
        .single();

      if (fetchError) throw fetchError;

      if (!updatedMember.is_claimed || updatedMember.user_id !== userId) {
        throw new Error('Failed to claim profile. Please try again.');
      }

      return { success: true, member: updatedMember };
    } catch (error) {
      console.error('Error claiming invite:', error);
      throw error;
    }
  },

  async updateFamilyMember(memberId, updates) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating family member:', error);
      throw error;
    }
  }
};

// Export the familyService as default and named export
export default familyService;