// src/services/familyService.js
import { supabase } from '../config/supabase';

// Helper function to validate generation level
const validateGenerationLevel = (level) => {
  return Math.max(-5, Math.min(5, level)); // Clamp between -5 and 5
};

// Helper function to infer relationships
const inferRelationships = async (familyId, newMember, directRelation) => {
  const inferredRelations = [];
  
  // Get all existing family members and relationships
  const { data: existingMembers } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId);

  const { data: existingRelations } = await supabase
    .from('family_relationships')
    .select('*')
    .eq('family_id', familyId);

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
        family_id: familyId,
        member1_id: newMember.id,
        member2_id: child.id,
        relationship_type: 'parent'
      });
    });
  }

  return inferredRelations;
};

// Move getFamilyMember function definition before it's used
const getFamilyMember = async (memberId) => {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting family member:', error);
    throw error;
  }
};

// Update addFamilyMember function to include relationship inference
const addFamilyMember = async (newMember) => {
  try {
    // Get existing relationships to determine generation level and family side
    const { data: existingRelations } = await supabase
      .from('family_relationships')
      .select('*')
      .eq('family_id', newMember.familyId);

    // Use the helper functions to determine generation level and family side
    const generationLevel = await determineGenerationLevel(
      newMember.familyId,
      newMember.relatedMemberId,
      existingRelations
    );

    const familySide = await determineFamilySide(
      newMember.familyId,
      newMember.relatedMemberId,
      existingRelations
    );

    // Start a Supabase transaction
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .insert([{
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

    // Create the direct relationship
    const directRelation = {
      family_id: newMember.familyId,
      member1_id: newMember.relatedMemberId,
      member2_id: member.id,
      relationship_type: newMember.relationshipType
    };

    // Add direct relationship
    const { error: relationError } = await supabase
      .from('family_relationships')
      .insert([directRelation]);

    if (relationError) throw relationError;

    // Infer and add additional relationships
    const inferredRelations = await inferRelationships(
      newMember.familyId,
      member,
      directRelation
    );

    if (inferredRelations.length > 0) {
      const { error: inferredError } = await supabase
        .from('family_relationships')
        .insert(inferredRelations);

      if (inferredError) throw inferredError;
    }

    // Add reciprocal relationships
    const reciprocalRelations = [];

    // Add reciprocal direct relationship
    reciprocalRelations.push({
      family_id: newMember.familyId,
      member1_id: member.id,
      member2_id: newMember.relatedMemberId,
      relationship_type: getReciprocalRelationType(newMember.relationshipType)
    });

    // Add reciprocal inferred relationships
    inferredRelations.forEach(rel => {
      reciprocalRelations.push({
        family_id: rel.family_id,
        member1_id: rel.member2_id,
        member2_id: rel.member1_id,
        relationship_type: getReciprocalRelationType(rel.relationship_type)
      });
    });

    if (reciprocalRelations.length > 0) {
      const { error: reciprocalError } = await supabase
        .from('family_relationships')
        .insert(reciprocalRelations);

      if (reciprocalError) throw reciprocalError;
    }

    return {
      member,
      directRelation,
      inferredRelations,
      reciprocalRelations
    };
  } catch (error) {
    console.error('Error adding family member:', error);
    throw error;
  }
};

// Helper function to get reciprocal relationship type
const getReciprocalRelationType = (relationType) => {
  switch (relationType) {
    case 'parent': return 'child';
    case 'child': return 'parent';
    case 'spouse': return 'spouse';
    default: return relationType;
  }
};

// Update the previewMemberAddition function to use the existingMembers and existingRelations
const previewMemberAddition = async (newMember) => {
  try {
    // Create a mock member object for inference
    const mockMember = {
      id: 'preview-member',
      family_id: newMember.familyId,
      first_name: newMember.firstName,
      last_name: newMember.lastName,
      birth_date: newMember.birthDate
    };

    // Create the direct relationship
    const directRelation = {
      family_id: newMember.familyId,
      member1_id: newMember.relatedMemberId,
      member2_id: mockMember.id,
      relationship_type: newMember.relationshipType
    };

    // Infer relationships
    const inferredRelations = await inferRelationships(
      newMember.familyId,
      mockMember,
      directRelation
    );

    // Return preview data
    return {
      member: mockMember,
      directRelation,
      inferredRelations
    };
  } catch (error) {
    console.error('Error previewing member addition:', error);
    throw error;
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
    const parentLevel = await getMemberGenerationLevel(familyId, parentRelation.member2_id);
    return validateGenerationLevel(parentLevel - 1);
  }

  // If member has children, they are one generation above their children
  const childRelation = memberRelations.find(rel =>
    rel.relationship_type === 'parent' && rel.member1_id === memberId
  );

  if (childRelation) {
    const childLevel = await getMemberGenerationLevel(familyId, childRelation.member2_id);
    return validateGenerationLevel(childLevel + 1);
  }

  return 0;
};

// Helper function to determine family side (maternal/paternal)
const determineFamilySide = async (familyId, memberId, relationships) => {
  // Root member is neutral
  if (!relationships || relationships.length === 0) return 'neutral';

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
};

// Helper function to check family line connection
const checkFamilyLineConnection = async (familyId, memberId, side, relationships, visited = new Set()) => {
  if (visited.has(memberId)) return false;
  visited.add(memberId);

  const memberRelations = relationships.filter(rel => 
    rel.member1_id === memberId || rel.member2_id === memberId
  );

  for (const relation of memberRelations) {
    const relatedMemberId = relation.member1_id === memberId ? relation.member2_id : relation.member1_id;
    const relatedMember = await getFamilyMember(relatedMemberId);

    if (relatedMember.family_side === side) return true;
    if (await checkFamilyLineConnection(familyId, relatedMemberId, side, relationships, visited)) return true;
  }

  return false;
};

// Helper function to get root family member
const getRootFamilyMember = async (familyId) => {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

// Helper function to get member's generation level
const getMemberGenerationLevel = async (familyId, memberId) => {
  const { data, error } = await supabase
    .from('family_members')
    .select('generation_level')
    .eq('id', memberId)
    .single();

  if (error) throw error;
  return data.generation_level;
};

export const familyService = {
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
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*, user_id, is_claimed')
        .eq('family_id', familyId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getFamilyMembers:', error);
      throw error;
    }
  },

  async getFamilyRelationships(familyId) {
    try {
      const { data, error } = await supabase
        .from('family_relationships')
        .select('*')
        .eq('family_id', familyId);

      if (error) throw error;
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

  async addFirstFamilyMember(familyId, memberData) {
    try {
      // Start a transaction
      const { data: newMember, error: memberError } = await supabase
        .from('family_members')
        .insert([{
          family_id: familyId,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          birth_date: memberData.birthDate,
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

      if (memberError) throw memberError;
      return newMember;
    } catch (error) {
      console.error('Error in addFirstFamilyMember:', error);
      throw error;
    }
  },

  getFamilyMember,

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

  previewMemberAddition,
  addFamilyMember,
  inferRelationships,
  getReciprocalRelationType,

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
  }
};