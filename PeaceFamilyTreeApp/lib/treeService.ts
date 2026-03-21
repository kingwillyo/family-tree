import { supabase } from './supabase';
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
  created_by: string | null;
  created_at: string;
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
    if (rel.relationship_type === 'child') {
      if (!childrenOf.has(rel.from_profile_id)) childrenOf.set(rel.from_profile_id, []);
      childrenOf.get(rel.from_profile_id)!.push(rel.to_profile_id);
    }
    if (rel.relationship_type === 'parent') {
      if (!parentsOf.has(rel.from_profile_id)) parentsOf.set(rel.from_profile_id, []);
      parentsOf.get(rel.from_profile_id)!.push(rel.to_profile_id);
    }
    if (rel.relationship_type === 'spouse') {
      // Only store once per person
      if (!spouseOf.has(rel.from_profile_id)) {
        spouseOf.set(rel.from_profile_id, rel.to_profile_id);
      }
    }
  }

  const toNode = (p: Profile, role?: string, includeSpouse = true): D3TreeNode => ({
    id: p.id,
    name: p.full_name,
    role: role ?? '',
    dates: formatDates(p),
    imageUrl: p.avatar_url ?? undefined,
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
  const buildAncestors = (id: string, visited = new Set<string>()): D3TreeNode | null => {
    if (visited.has(id)) return null;
    visited.add(id);

    const profile = profileMap.get(id);
    if (!profile) return null;

    const parents = (parentsOf.get(id) ?? [])
      .map((pid) => buildAncestors(pid, new Set(visited)))
      .filter(Boolean) as D3TreeNode[];

    return {
      ...toNode(profile),
      children: parents.length ? parents : undefined,
    };
  };

  const descendants = buildDescendants(rootId);

  // Ancestors: we need a synthetic dummy root that wraps the root's parents,
  // matching the existing tree.tsx convention of 'main-1-ancestors-root'.
  const rootParentIds = parentsOf.get(rootId) ?? [];
  const ancestorChildren = rootParentIds
    .map((pid) => buildAncestors(pid))
    .filter(Boolean) as D3TreeNode[];

  const ancestors: D3TreeNode = {
    id: 'main-1-ancestors-root',
    name: 'dummy-root-for-parents',
    relativeId: rootId,
    relativeName: profileMap.get(rootId)?.full_name ?? 'Current User',
    children: ancestorChildren.length ? ancestorChildren : undefined,
  };

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
        .select('to_profile_id')
        .eq('from_profile_id', relativeId)
        .eq('relationship_type', 'child');

      if (children) {
        for (const c of children) {
          relsToInsert.push(
            { from_profile_id: newId, to_profile_id: c.to_profile_id, relationship_type: 'child', created_by: createdBy },
            { from_profile_id: c.to_profile_id, to_profile_id: newId, relationship_type: 'parent', created_by: createdBy }
          );
        }
      }
    }

    // B. If adding a CHILD to A, and A has a SPOUSE, the new child is also a CHILD to that spouse.
    if (relationType === 'child') {
      const { data: spouses } = await supabase
        .from('relationships')
        .select('to_profile_id')
        .eq('from_profile_id', relativeId)
        .eq('relationship_type', 'spouse');

      if (spouses) {
        for (const s of spouses) {
          relsToInsert.push(
            { from_profile_id: s.to_profile_id, to_profile_id: newId, relationship_type: 'child', created_by: createdBy },
            { from_profile_id: newId, to_profile_id: s.to_profile_id, relationship_type: 'parent', created_by: createdBy }
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
