import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { D3TreeNode } from '../constants/mockTreeData';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Profile {
  id: string;
  user_id: string | null;
  full_name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  birth_place: string | null;
  avatar_url: string | null;
  gender: 'male' | 'female' | null;
  is_living: boolean;
  visibility: string;
  bio: string | null;
  role: 'admin' | 'member';
  created_by: string | null;
  created_at: string;
}

export interface EditProposal {
  id: string;
  target_profile_id: string;
  proposed_by: string;
  change_type: string;
  proposed_data: any;
  original_data: any;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Included in joins
  target_profile?: Profile;
  proposer_profile?: Profile;
}

export interface Relationship {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  relationship_type: 'parent' | 'child' | 'spouse';
  created_by: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDates(profile: Profile): string {
  const birth = profile.date_of_birth ? new Date(profile.date_of_birth).getFullYear() : null;
  const death = profile.is_living ? null : (profile.date_of_death ? new Date(profile.date_of_death).getFullYear() : 'present');
  if (birth && death) return `${birth} — ${death}`;
  if (birth) return `b. ${birth}`;
  return '';
}

const INVERSE: Record<'parent' | 'child' | 'spouse', 'parent' | 'child' | 'spouse'> = {
  parent: 'child',
  child: 'parent',
  spouse: 'spouse',
};

// ─────────────────────────────────────────────
// 1. Fetch the current user's linked profile
// ─────────────────────────────────────────────

export async function fetchCurrentUserProfile(userId: string): Promise<Profile | null> {
  // First try family_members to get the linked profile_id
  const { data: fm } = await supabase
    .from('family_members')
    .select('profile_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (fm?.profile_id) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', fm.profile_id)
      .single();
    return data ?? null;
  }

  // Fallback: profile with matching user_id
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data ?? null;
}

// ─────────────────────────────────────────────
// 2. Fetch all profiles + relationships for the tree
// We load everything and traverse in memory – suitable
// for family trees (typically < 1000 nodes).
// ─────────────────────────────────────────────

export interface TreeData {
  profiles: Profile[];
  relationships: Relationship[];
}

export async function fetchTreeData(): Promise<TreeData> {
  const [profilesRes, relationshipsRes] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at'),
    supabase.from('relationships').select('*'),
  ]);

  return {
    profiles: profilesRes.data ?? [],
    relationships: relationshipsRes.data ?? [],
  };
}

// ─────────────────────────────────────────────
// 3. Build D3TreeNode trees from flat DB rows
// Returns { descendants, ancestors } shaped for tree.tsx
// ─────────────────────────────────────────────

export function buildD3Tree(
  profiles: Profile[],
  relationships: Relationship[],
  rootId: string
): { descendants: D3TreeNode; ancestors: D3TreeNode } {
  const profileMap = new Map<string, Profile>(profiles.map((p) => [p.id, p]));

  // Build adjacency maps
  const childrenOf = new Map<string, string[]>();   // parent → [childId]
  const parentsOf = new Map<string, string[]>();    // child  → [parentId]
  const spouseOf = new Map<string, string>();        // id → spouseId (first spouse)

  for (const rel of relationships) {
    const from = rel.from_profile_id;
    const to = rel.to_profile_id;

    if (rel.relationship_type === 'child') {
      // from is Parent, to is Child
      if (!childrenOf.has(from)) childrenOf.set(from, []);
      if (!childrenOf.get(from)!.includes(to)) childrenOf.get(from)!.push(to);
      
      if (!parentsOf.has(to)) parentsOf.set(to, []);
      if (!parentsOf.get(to)!.includes(from)) parentsOf.get(to)!.push(from);
    } else if (rel.relationship_type === 'parent') {
      // from is Child, to is Parent
      if (!childrenOf.has(to)) childrenOf.set(to, []);
      if (!childrenOf.get(to)!.includes(from)) childrenOf.get(to)!.push(from);
      
      if (!parentsOf.has(from)) parentsOf.set(from, []);
      if (!parentsOf.get(from)!.includes(to)) parentsOf.get(from)!.push(to);
    } else if (rel.relationship_type === 'spouse') {
      // from relates as spouse to to
      if (!spouseOf.has(from)) {
        spouseOf.set(from, to);
      }
      // Also ensure reverse spouse mapping exists for easier lookup
      if (!spouseOf.has(to)) {
        spouseOf.set(to, from);
      }
    }
  }

  const toNode = (p: Profile, role?: string, includeSpouse = true): D3TreeNode => ({
    id: p.id,
    name: p.full_name,
    role: role ?? '',
    dates: formatDates(p),
    imageUrl: p.avatar_url ?? undefined,
    admin: p.role === 'admin',
    spouse: (includeSpouse && spouseOf.has(p.id))
      ? (() => {
          const sp = profileMap.get(spouseOf.get(p.id)!);
          return sp ? toNode(sp, undefined, false) : undefined;
        })()
      : undefined,
  });

  // ── Descendants tree (root → children → grandchildren …) ──
  const buildDescendants = (id: string, visited = new Set<string>()): D3TreeNode => {
    if (visited.has(id)) {
      // Safety: prevent circular references
      const p = profileMap.get(id);
      return p ? toNode(p) : { id, name: 'Unknown' };
    }
    visited.add(id);

    const profile = profileMap.get(id);
    if (!profile) return { id, name: 'Unknown' };

    const isRoot = id === rootId;
    const node: D3TreeNode = {
      ...toNode(profile, isRoot ? 'CURRENT USER' : undefined),
      children: (childrenOf.get(id) ?? []).map((cid) => buildDescendants(cid, new Set(visited))),
    };
    return node;
  };

  // ── Ancestors tree (synthetic root → parents → grandparents …) ──
  const getAllParents = (profileId: string) => {
    return parentsOf.get(profileId) ?? [];
  };

  const buildAncestors = (id: string, visited = new Set<string>()): D3TreeNode | null => {
    if (visited.has(id)) return null;
    visited.add(id);

    const profile = profileMap.get(id);
    if (!profile) return null;

    const parents = getAllParents(id)
      .map((pid) => buildAncestors(pid, new Set(visited)))
      .filter(Boolean) as D3TreeNode[];

    return {
      ...toNode(profile, undefined, true),
      children: parents.length ? parents : undefined,
    };
  };

  const descendants = buildDescendants(rootId) || { id: rootId, name: '', children: [] };
  const ancestors = buildAncestors(rootId) || { id: rootId, name: '', children: [] };

  return { descendants, ancestors };
}

// ─────────────────────────────────────────────
// 4. Add a new family member
// Inserts into profiles, then creates reciprocal relationships
// ─────────────────────────────────────────────

export interface AddMemberInput {
  fullName: string;
  dateOfBirth?: string | null;
  birthPlace?: string | null;
  isLiving: boolean;
  gender?: 'male' | 'female' | null;
  avatarUrl?: string | null;
}

export async function addMember(
  input: AddMemberInput,
  createdBy: string,
  relativeId?: string,
  relationType?: 'parent' | 'child' | 'spouse'
): Promise<{ profileId: string } | { error: string }> {
  // 1. Insert profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      full_name: input.fullName,
      date_of_birth: input.dateOfBirth ?? null,
      birth_place: input.birthPlace ?? null,
      is_living: input.isLiving,
      gender: input.gender ?? null,
      avatar_url: input.avatarUrl ?? null,
      visibility: 'family',
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (profileError || !profile) {
    return { error: profileError?.message ?? 'Failed to create profile' };
  }

  const newId = profile.id;

  // 2. Insert relationship pair (if applicable)
  if (relativeId && relationType) {
    const inverseType = INVERSE[relationType];
    const relsToInsert = [
      { from_profile_id: newId, to_profile_id: relativeId, relationship_type: inverseType, created_by: createdBy },
      { from_profile_id: relativeId, to_profile_id: newId, relationship_type: relationType, created_by: createdBy },
    ];

    // --- Relationship Inheritance ---
    
    // A. If adding a SPOUSE to A, and A has CHILDREN, the new spouse is also a PARENT to those children.
    if (relationType === 'spouse') {
      const { data: children } = await supabase
        .from('relationships')
        .select('*')
        .or(`from_profile_id.eq.${relativeId},to_profile_id.eq.${relativeId}`)
        .eq('relationship_type', 'child');

      if (children) {
        for (const c of children) {
          const childId = c.from_profile_id === relativeId ? c.to_profile_id : c.from_profile_id;
          relsToInsert.push(
            { from_profile_id: newId, to_profile_id: childId, relationship_type: 'child', created_by: createdBy },
            { from_profile_id: childId, to_profile_id: newId, relationship_type: 'parent', created_by: createdBy }
          );
        }
      }
    }

    // B. If adding a CHILD to A, and A has a SPOUSE, the new child is also a CHILD to that spouse.
    if (relationType === 'child') {
      const { data: spouses } = await supabase
        .from('relationships')
        .select('*')
        .or(`from_profile_id.eq.${relativeId},to_profile_id.eq.${relativeId}`)
        .eq('relationship_type', 'spouse');

      if (spouses) {
        for (const s of spouses) {
          const spouseId = s.from_profile_id === relativeId ? s.to_profile_id : s.from_profile_id;
          relsToInsert.push(
            { from_profile_id: spouseId, to_profile_id: newId, relationship_type: 'child', created_by: createdBy },
            { from_profile_id: newId, to_profile_id: spouseId, relationship_type: 'parent', created_by: createdBy }
          );
        }
      }
    }

    // C. If adding a PARENT to A, and A has SIBLINGS (other children of the new parent candidate?),
    // that's more complex, let's stick to the two most common cases.

    const { error: relError } = await supabase.from('relationships').insert(relsToInsert);
    if (relError) {
      return { error: `Member added but relationships failed: ${relError.message}` };
    }
  }

  return { profileId: newId };
}

// ─────────────────────────────────────────────
// 5. Fetch a single profile + its relationships (for member detail)
// ─────────────────────────────────────────────

export interface MemberDetail {
  profile: Profile;
  relationships: Array<Relationship & { relatedProfile: Profile }>;
}

export async function fetchMemberDetail(profileId: string): Promise<MemberDetail | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error || !profile) return null;

  // Fetch all relationships where this profile appears
  const { data: rels } = await supabase
    .from('relationships')
    .select('*')
    .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`);

  if (!rels?.length) {
    return { profile, relationships: [] };
  }

  // Collect the IDs of all related profiles
  const relatedIds = [
    ...new Set(rels.flatMap((r) => [r.from_profile_id, r.to_profile_id]).filter((id) => id !== profileId)),
  ];

  const { data: relatedProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', relatedIds);

  const relatedMap = new Map<string, Profile>((relatedProfiles ?? []).map((p) => [p.id, p]));

  // Attach the related profile to each relationship, normalise direction
  const enriched = rels
    .map((rel) => {
      const relatedId = rel.from_profile_id === profileId ? rel.to_profile_id : rel.from_profile_id;
      const relatedProfile = relatedMap.get(relatedId);
      if (!relatedProfile) return null;

      // Normalise: relationship_type should describe how the RELATED person relates to THIS profile
      let type = rel.relationship_type as 'parent' | 'child' | 'spouse';
      if (rel.to_profile_id === profileId && type !== 'spouse') {
        type = INVERSE[type];
      }
      return { ...rel, relationship_type: type, relatedProfile };
    })
    .filter(Boolean) as Array<Relationship & { relatedProfile: Profile }>;

  return { profile, relationships: enriched };
}

// ─────────────────────────────────────────────
// 6. Fetch a single profile by ID
// ─────────────────────────────────────────────

export async function fetchProfileById(profileId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

// ─────────────────────────────────────────────
// 7. Timeline Events
// ─────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  profile_id: string;
  icon: string;
  year: string;
  title: string;
  date_label: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AddTimelineEventInput {
  icon: string;
  year: string;
  title: string;
  dateLabel?: string;
  description?: string;
}

export async function fetchTimelineEvents(profileId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .eq('profile_id', profileId)
    .order('year', { ascending: true });
  if (error) {
    console.error('fetchTimelineEvents error:', error.message);
    return [];
  }
  return data ?? [];
}

export async function addTimelineEvent(
  input: AddTimelineEventInput,
  profileId: string,
  userId: string
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from('timeline_events')
    .insert({
      profile_id: profileId,
      icon: input.icon,
      year: input.year,
      title: input.title,
      date_label: input.dateLabel ?? null,
      description: input.description ?? null,
      created_by: userId,
    })
    .select('id')
    .single();
  if (error || !data) return { error: error?.message ?? 'Failed to add event' };
  return { id: data.id };
}

export async function deleteTimelineEvent(eventId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('timeline_events').delete().eq('id', eventId);
  return error ? { error: error.message } : {};
}

// ─────────────────────────────────────────────
// 8. Member Media (from memories table)
// ─────────────────────────────────────────────

export interface Memory {
  id: string;
  author_profile_id: string | null;
  created_by: string | null;
  type: 'story' | 'photo' | 'audio';
  title: string | null;
  body: string | null;
  location: string | null;
  image_urls: string[];
  audio_url: string | null;
  created_at: string;
}

export async function fetchMemberMedia(profileId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('author_profile_id', profileId)
    .in('type', ['photo', 'audio'])
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchMemberMedia error:', error.message);
    return [];
  }
  return data ?? [];
}

export async function uploadMemberMedia(
  localUri: string,
  userId: string,
  profileId: string
): Promise<{ url: string } | { error: string }> {
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
    const path = `${profileId}/${Date.now()}.${ext}`;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    const { error: uploadError } = await supabase.storage
      .from('member-media')
      .upload(path, bytes, { contentType: mimeType, upsert: false });
    if (uploadError) return { error: uploadError.message };

    const { data: urlData } = supabase.storage.from('member-media').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: dbError } = await supabase.from('memories').insert({
      author_profile_id: profileId,
      type: 'photo',
      image_urls: [publicUrl],
      created_by: userId,
    });
    if (dbError) return { error: dbError.message };

    return { url: publicUrl };
  } catch (err: any) {
    return { error: err?.message ?? 'Upload failed' };
  }
}

// ─────────────────────────────────────────────
// 9. Upload / update avatar
// ─────────────────────────────────────────────

export async function uploadAvatar(
  localUri: string,
  userId: string,
  profileId: string
): Promise<{ url: string } | { error: string }> {
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const path = `${profileId}/avatar.${ext}`;
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    const { error: uploadError } = await supabase.storage
      .from('member-avatars')
      .upload(path, bytes, { contentType: mimeType, upsert: true });
    if (uploadError) return { error: uploadError.message };

    const { data: urlData } = supabase.storage.from('member-avatars').getPublicUrl(path);
    // Append a cache-buster so the image view refreshes
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', profileId);
    if (dbError) return { error: dbError.message };

    return { url: publicUrl };
  } catch (err: any) {
    return { error: err?.message ?? 'Upload failed' };
  }
}

// ─────────────────────────────────────────────
// 10. Member stats
// ─────────────────────────────────────────────

export interface MemberStats {
  memoriesCount: number;
  eventsCount: number;
  childrenCount: number;
  connectionsCount: number;
}

export async function fetchMemberStats(profileId: string): Promise<MemberStats> {
  const [memoriesRes, eventsRes, relsRes] = await Promise.all([
    supabase
      .from('memories')
      .select('id', { count: 'exact', head: true })
      .eq('author_profile_id', profileId),
    supabase
      .from('timeline_events')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId),
    supabase
      .from('relationships')
      .select('relationship_type')
      .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`),
  ]);

  const rels = relsRes.data ?? [];
  // Normalise: count each unique related person once as a child
  const childrenCount = rels.filter((r) => {
    // from→child means this profile is a parent of someone
    return (
      (r.relationship_type === 'child' && relsRes.data?.find((x) => x === r)) ||
      r.relationship_type === 'child'
    );
  }).length;

  // Count unique `child` type relationships where this profile IS the parent
  const childRels = rels.filter((r) => r.relationship_type === 'child');

  return {
    memoriesCount: memoriesRes.count ?? 0,
    eventsCount: eventsRes.count ?? 0,
    childrenCount: childRels.length,
    connectionsCount: rels.length,
  };
}

// ─────────────────────────────────────────────
// 11. Fetch connections (related profiles with type)
// ─────────────────────────────────────────────

export interface ProfileConnection {
  profile: Profile;
  relationshipType: 'parent' | 'child' | 'spouse';
}

export async function fetchMemberConnections(profileId: string): Promise<ProfileConnection[]> {
  const { data: rels, error } = await supabase
    .from('relationships')
    .select('*')
    .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`);

  if (error || !rels?.length) return [];

  const relatedIds = [
    ...new Set(
      rels.flatMap((r) => [r.from_profile_id, r.to_profile_id]).filter((id) => id !== profileId)
    ),
  ];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', relatedIds);

  const profileMap = new Map<string, Profile>((profiles ?? []).map((p) => [p.id, p]));

  const seen = new Set<string>();
  const result: ProfileConnection[] = [];

  for (const rel of rels) {
    const relatedId = rel.from_profile_id === profileId ? rel.to_profile_id : rel.from_profile_id;
    if (seen.has(relatedId)) continue;
    seen.add(relatedId);
    const profile = profileMap.get(relatedId);
    if (!profile) continue;
    let type = rel.relationship_type as 'parent' | 'child' | 'spouse';
    // Normalise direction: what is the related person TO this profile?
    if (rel.to_profile_id === profileId && type !== 'spouse') {
      type = INVERSE[type];
    }
    result.push({ profile, relationshipType: type });
  }

  return result;
}

// ─────────────────────────────────────────────
// 12. Collaboration / Proposals
// ─────────────────────────────────────────────

export async function fetchCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Try family_members first
  const { data: fm } = await supabase
    .from('family_members')
    .select('profile_id')
    .eq('user_id', user.id)
    .maybeSingle();
  
  const pid = fm?.profile_id;
  if (pid) return fetchProfileById(pid);

  // Fallback to profiles table direct
  const { data: p } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  return p as Profile | null;
}

export async function createProposal(
  targetProfileId: string,
  proposedByProfileId: string,
  changeType: string,
  proposedData: any,
  originalData?: any
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('edit_proposals')
    .insert({
      target_profile_id: targetProfileId,
      proposed_by: proposedByProfileId,
      change_type: changeType,
      proposed_data: proposedData,
      original_data: originalData || null,
    });
  return error ? { error: error.message } : {};
}

export async function fetchProposals(status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending'): Promise<EditProposal[]> {
  let query = supabase
    .from('edit_proposals')
    .select(`
      *,
      target_profile:profiles!target_profile_id(*),
      proposer_profile:profiles!proposed_by(*)
    `)
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching proposals:', error.message);
    return [];
  }
  return data as EditProposal[];
}

export async function updateProposalStatus(
  proposal: EditProposal,
  status: 'approved' | 'rejected',
  adminProfileId: string
): Promise<{ error?: string }> {
  if (status === 'approved') {
    // Apply the changes to the target profile
    if (proposal.change_type === 'profile_update') {
      const { error: applyError } = await supabase
        .from('profiles')
        .update(proposal.proposed_data)
        .eq('id', proposal.target_profile_id);
      
      if (applyError) return { error: applyError.message };
    } else if (proposal.change_type === 'timeline_add') {
      const { error: applyError } = await supabase
        .from('timeline_events')
        .insert({
          ...proposal.proposed_data,
          profile_id: proposal.target_profile_id,
        });
      if (applyError) return { error: applyError.message };
    } else if (proposal.change_type === 'avatar_update') {
      const { error: applyError } = await supabase
        .from('profiles')
        .update({ avatar_url: proposal.proposed_data.url })
        .eq('id', proposal.target_profile_id);
      if (applyError) return { error: applyError.message };
    } else if (proposal.change_type === 'timeline_delete') {
      const { error: applyError } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', proposal.proposed_data.event_id);
      if (applyError) return { error: applyError.message };
    }
  }

  const { error } = await supabase
    .from('edit_proposals')
    .update({ 
      status, 
      reviewed_by: adminProfileId, 
      reviewed_at: new Date().toISOString() 
    })
    .eq('id', proposal.id);
    
  return error ? { error: error.message } : {};
}
