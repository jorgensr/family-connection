// src/services/familyService.js
import { supabase } from '../config/supabase';

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

  // Infer siblings if parent relationship is being added
  if (directRelation.relationship_type === 'parent') {
    const siblings = existingMembers.filter(member =>
      existingRelations.some(rel =>
        rel.relationship_type === 'child' &&
        rel.member1_id === directRelation.member1_id &&
        rel.member2_id === member.id &&
        member.id !== newMember.id
      )
    );

    siblings.forEach(sibling => {
      inferredRelations.push({
        family_id: familyId,
        member1_id: newMember.id,
        member2_id: sibling.id,
        relationship_type: 'sibling'
      });
    });
  }

  // Infer grandchildren if parent relationship is being added
  if (directRelation.relationship_type === 'parent') {
    const children = existingMembers.filter(member =>
      existingRelations.some(rel =>
        rel.relationship_type === 'child' &&
        rel.member1_id === directRelation.member2_id &&
        rel.member2_id === member.id
      )
    );

    children.forEach(child => {
      inferredRelations.push({
        family_id: familyId,
        member1_id: newMember.id,
        member2_id: child.id,
        relationship_type: 'grandparent'
      });
    });
  }

  // Infer in-laws if spouse relationship is being added
  if (directRelation.relationship_type === 'spouse') {
    const spouseParents = existingMembers.filter(member =>
      existingRelations.some(rel =>
        rel.relationship_type === 'parent' &&
        rel.member1_id === member.id &&
        rel.member2_id === directRelation.member2_id
      )
    );

    spouseParents.forEach(parent => {
      inferredRelations.push({
        family_id: familyId,
        member1_id: newMember.id,
        member2_id: parent.id,
        relationship_type: 'in-law'
      });
    });
  }

  return inferredRelations;
};

// Update addFamilyMember function to include relationship inference
const addFamilyMember = async (newMember) => {
  try {
    // Start a Supabase transaction
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .insert([{
        family_id: newMember.familyId,
        first_name: newMember.firstName,
        last_name: newMember.lastName,
        birth_date: newMember.birthDate,
        profile_picture_url: newMember.profilePictureUrl
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
    case 'sibling': return 'sibling';
    case 'grandparent': return 'grandchild';
    case 'grandchild': return 'grandparent';
    case 'in-law': return 'in-law';
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

export const familyService = {
  async getOrCreateFamily(name) {
    try {
      // First try to find an existing family
      let { data: family, error } = await supabase
        .from('families')
        .select('*')
        .eq('name', name)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no family exists, create one
      if (!family) {
        const { data: newFamily, error: createError } = await supabase
          .from('families')
          .insert([{ name }])
          .select()
          .single();

        if (createError) throw createError;
        family = newFamily;
      }

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
      const { data: newMember, error: memberError } = await supabase
        .from('family_members')
        .insert([{
          family_id: familyId,
          first_name: memberData.firstName,
          last_name: memberData.lastName,
          birth_date: memberData.birthDate,
          bio: memberData.bio,
          user_id: memberData.userId
        }])
        .select()
        .single();

      if (memberError) throw memberError;

      // Create self relationship
      const { error: relationshipError } = await supabase
        .from('family_relationships')
        .insert([{
          family_id: familyId,
          member1_id: newMember.id,
          member2_id: newMember.id,
          relationship_type: 'self'
        }]);

      if (relationshipError) throw relationshipError;

      return newMember;
    } catch (error) {
      console.error('Error in addFirstFamilyMember:', error);
      throw error;
    }
  },

  async getFamilyMember(memberId) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*, user_id, is_claimed')
        .eq('id', memberId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting family member:', error);
      throw error;
    }
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

  previewMemberAddition,
  addFamilyMember,
  inferRelationships,
  getReciprocalRelationType
};