import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid'; // Ensure you install uuid: npm install uuid


async function getOrCreateFamily(name) {
  const { data: { user } } = await supabase.auth.getUser();

  let { data: existingFamilies, error } = await supabase
    .from('families')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) throw error;

  let existingFamily = existingFamilies?.[0];

  if (!existingFamily) {
    const { data: newFamily, error: createError } = await supabase
      .from('families')
      .insert([{ name, created_by: user.id }])
      .select()
      .single();

    if (createError) throw createError;
    existingFamily = newFamily;
  }

  return existingFamily;
}

async function addFamilyMember(familyId, memberData) {
  // If this member is created without a user account, generate an invite token
  let inviteToken = null;
  if (!memberData.userId) {
    inviteToken = uuidv4(); // generate a unique token for invites
  }

  const { data, error } = await supabase
    .from('family_members')
    .insert([{
      family_id: familyId,
      first_name: memberData.firstName,
      last_name: memberData.lastName,
      birth_date: memberData.birthDate || null,
      relationship: memberData.relationship,
      parent_member_id: memberData.parentMemberId || null,
      bio: memberData.bio || null,
      profile_picture_url: memberData.profile_picture_url || null,
      user_id: memberData.userId || null, // if you pass userId, it sets it; otherwise null
      invite_token: inviteToken
    }])
    .select()
    .single();

  if (error) throw error;

  return data;
}

async function updateFamilyMember(memberId, updates) {
  const { data, error } = await supabase
    .from('family_members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getFamilyTree(familyId) {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at');

  if (error) throw error;
  return buildFamilyTree(data);
}

function buildFamilyTree(members) {
  const membersById = {};
  const rootMembers = [];

  members.forEach(member => {
    membersById[member.id] = {
      ...member,
      children: []
    };
  });

  members.forEach(member => {
    if (member.parent_member_id) {
      const parent = membersById[member.parent_member_id];
      if (parent) {
        parent.children.push(membersById[member.id]);
      }
    } else {
      rootMembers.push(membersById[member.id]);
    }
  });

  return rootMembers;
}

async function addFamilyMemory(familyId, memoryData) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('family_memories')
    .insert([{
      family_id: familyId,
      title: memoryData.title,
      description: memoryData.description || null,
      media_url: memoryData.mediaUrl || null,
      created_by: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getFamilyMemories(familyId) {
  const { data, error } = await supabase
    .from('family_memories')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function updateFamilyMemberByInviteToken(inviteToken, userId) {
  const { data, error } = await supabase
    .from('family_members')
    .update({ user_id: userId, invite_token: null })
    .eq('invite_token', inviteToken)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export const familyService = {
  getOrCreateFamily,
  addFamilyMember,
  updateFamilyMemberByInviteToken,
  updateFamilyMember,
  getFamilyTree,
  buildFamilyTree,
  addFamilyMemory,
  getFamilyMemories
};
