import type { Profile, Relationship } from './treeService';

export const FAMILY_NODE_SIZE = 76;
export const FAMILY_COUPLE_DISTANCE = 128;
export const FAMILY_GENERATION_GAP = 180;

const SINGLE_UNIT_WIDTH = 116;
const COUPLE_UNIT_WIDTH = FAMILY_COUPLE_DISTANCE + FAMILY_NODE_SIZE;
const UNIT_GAP = 52;

export interface FamilyLayoutPerson {
  id: string;
  name: string;
  dates: string;
  imageUrl?: string;
  admin: boolean;
  isCurrentUser: boolean;
  x: number;
  y: number;
}

export interface FamilyLayoutUnit {
  id: string;
  memberIds: string[];
  members: FamilyLayoutPerson[];
  generation: number;
  width: number;
  x: number;
  y: number;
}

export interface FamilyLayoutLink {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface FamilyTreeLayout {
  units: FamilyLayoutUnit[];
  links: FamilyLayoutLink[];
  people: FamilyLayoutPerson[];
  unconnectedCount: number;
}

interface WorkingUnit {
  id: string;
  memberIds: string[];
  generation: number;
  width: number;
  x: number;
}

function addToMap(map: Map<string, Set<string>>, key: string, value: string) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(value);
}

function formatProfileDates(profile: Profile): string {
  const birthYear = profile.date_of_birth
    ? new Date(profile.date_of_birth).getFullYear()
    : null;
  const deathYear = profile.date_of_death
    ? new Date(profile.date_of_death).getFullYear()
    : null;

  if (birthYear && deathYear) return `${birthYear}–${deathYear}`;
  if (birthYear) return profile.is_living ? `b. ${birthYear}` : `${birthYear}`;
  return '';
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function placeRow(
  units: WorkingUnit[],
  desiredPosition: (unit: WorkingUnit) => number,
  profileMap: Map<string, Profile>
) {
  if (!units.length) return;

  const desired = new Map(units.map((unit) => [unit.id, desiredPosition(unit)]));
  const ordered = [...units].sort((a, b) => {
    const positionDifference = desired.get(a.id)! - desired.get(b.id)!;
    if (Math.abs(positionDifference) > 0.5) return positionDifference;
    const aName = profileMap.get(a.memberIds[0])?.full_name ?? '';
    const bName = profileMap.get(b.memberIds[0])?.full_name ?? '';
    return aName.localeCompare(bName);
  });

  ordered[0].x = desired.get(ordered[0].id)!;
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    const minimumX = previous.x + previous.width / 2 + current.width / 2 + UNIT_GAP;
    current.x = Math.max(desired.get(current.id)!, minimumX);
  }

  const desiredCenter = average(ordered.map((unit) => desired.get(unit.id)!));
  const actualCenter = average(ordered.map((unit) => unit.x));
  const correction = desiredCenter - actualCenter;
  ordered.forEach((unit) => {
    unit.x += correction;
  });
}

export function buildFamilyTreeLayout(
  profiles: Profile[],
  relationships: Relationship[],
  rootId: string
): FamilyTreeLayout {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  if (!profileMap.has(rootId)) {
    return { units: [], links: [], people: [], unconnectedCount: profiles.length };
  }

  const childrenOf = new Map<string, Set<string>>();
  const parentsOf = new Map<string, Set<string>>();
  const partnersOf = new Map<string, Set<string>>();
  const neighbours = new Map<string, Set<string>>();

  const connect = (firstId: string, secondId: string) => {
    addToMap(neighbours, firstId, secondId);
    addToMap(neighbours, secondId, firstId);
  };

  relationships.forEach((relationship) => {
    const from = relationship.from_profile_id;
    const to = relationship.to_profile_id;
    if (!profileMap.has(from) || !profileMap.has(to)) return;

    if (relationship.relationship_type === 'child') {
      addToMap(childrenOf, from, to);
      addToMap(parentsOf, to, from);
      connect(from, to);
    } else if (relationship.relationship_type === 'parent') {
      addToMap(childrenOf, to, from);
      addToMap(parentsOf, from, to);
      connect(from, to);
    } else if (relationship.relationship_type === 'spouse') {
      addToMap(partnersOf, from, to);
      addToMap(partnersOf, to, from);
      connect(from, to);
    }
  });

  // Keep the main canvas focused on the signed-in person's connected family.
  const connectedIds = new Set<string>([rootId]);
  const connectionQueue = [rootId];
  while (connectionQueue.length) {
    const personId = connectionQueue.shift()!;
    for (const neighbourId of neighbours.get(personId) ?? []) {
      if (connectedIds.has(neighbourId)) continue;
      connectedIds.add(neighbourId);
      connectionQueue.push(neighbourId);
    }
  }

  // Assign a generation relative to the current person. Partners share a row,
  // parents move one row up, and children move one row down.
  const generations = new Map<string, number>([[rootId, 0]]);
  const generationQueue = [rootId];
  while (generationQueue.length) {
    const personId = generationQueue.shift()!;
    const generation = generations.get(personId)!;

    const candidates: { id: string; generation: number }[] = [
      ...[...(partnersOf.get(personId) ?? [])].map((id) => ({ id, generation })),
      ...[...(parentsOf.get(personId) ?? [])].map((id) => ({ id, generation: generation - 1 })),
      ...[...(childrenOf.get(personId) ?? [])].map((id) => ({ id, generation: generation + 1 })),
    ];

    candidates.forEach((candidate) => {
      if (!connectedIds.has(candidate.id) || generations.has(candidate.id)) return;
      generations.set(candidate.id, candidate.generation);
      generationQueue.push(candidate.id);
    });
  }

  // A couple is a single layout unit. D3 previously positioned one partner and
  // appended the other afterward, which caused the wide gaps and collisions.
  const assignedPeople = new Set<string>();
  const workingUnits: WorkingUnit[] = [];
  const personToUnit = new Map<string, string>();
  const stablePeople = profiles.filter((profile) => connectedIds.has(profile.id));

  stablePeople.forEach((profile) => {
    if (assignedPeople.has(profile.id)) return;

    const availablePartner = [...(partnersOf.get(profile.id) ?? [])].find(
      (partnerId) => connectedIds.has(partnerId) && !assignedPeople.has(partnerId)
    );
    const memberIds = availablePartner ? [profile.id, availablePartner] : [profile.id];
    const unitId = [...memberIds].sort().join(':');
    const unit: WorkingUnit = {
      id: unitId,
      memberIds,
      generation: generations.get(profile.id) ?? 0,
      width: memberIds.length === 2 ? COUPLE_UNIT_WIDTH : SINGLE_UNIT_WIDTH,
      x: 0,
    };

    memberIds.forEach((personId) => {
      assignedPeople.add(personId);
      personToUnit.set(personId, unitId);
    });
    workingUnits.push(unit);
  });

  const unitMap = new Map(workingUnits.map((unit) => [unit.id, unit]));
  const rootUnitId = personToUnit.get(rootId)!;
  const personOffsetInUnit = (personId: string) => {
    const unitId = personToUnit.get(personId);
    const unit = unitId ? unitMap.get(unitId) : undefined;
    if (!unit || unit.memberIds.length < 2) return 0;
    return unit.memberIds[0] === personId
      ? -FAMILY_COUPLE_DISTANCE / 2
      : FAMILY_COUPLE_DISTANCE / 2;
  };
  const rawLinks = new Map<
    string,
    { parentUnitId: string; childUnitId: string; parentIds: Set<string>; childId: string }
  >();

  childrenOf.forEach((childIds, parentId) => {
    if (!connectedIds.has(parentId)) return;
    childIds.forEach((childId) => {
      if (!connectedIds.has(childId)) return;
      const parentUnitId = personToUnit.get(parentId);
      const childUnitId = personToUnit.get(childId);
      if (!parentUnitId || !childUnitId || parentUnitId === childUnitId) return;

      const key = `${parentUnitId}>${childUnitId}>${childId}`;
      const existing = rawLinks.get(key);
      if (existing) {
        existing.parentIds.add(parentId);
      } else {
        rawLinks.set(key, {
          parentUnitId,
          childUnitId,
          parentIds: new Set([parentId]),
          childId,
        });
      }
    });
  });

  const rows = new Map<number, WorkingUnit[]>();
  workingUnits.forEach((unit) => {
    if (!rows.has(unit.generation)) rows.set(unit.generation, []);
    rows.get(unit.generation)!.push(unit);
  });

  // Put the current person's unit at the visual origin and balance relatives
  // on the same generation around it.
  const focusRow = rows.get(0) ?? [];
  const focusUnit = unitMap.get(rootUnitId)!;
  const otherFocusUnits = focusRow
    .filter((unit) => unit.id !== rootUnitId)
    .sort((a, b) => {
      const aName = profileMap.get(a.memberIds[0])?.full_name ?? '';
      const bName = profileMap.get(b.memberIds[0])?.full_name ?? '';
      return aName.localeCompare(bName);
    });
  const focusInsertIndex = Math.floor(otherFocusUnits.length / 2);
  const orderedFocusRow = [
    ...otherFocusUnits.slice(0, focusInsertIndex),
    focusUnit,
    ...otherFocusUnits.slice(focusInsertIndex),
  ];
  let focusCursor = 0;
  orderedFocusRow.forEach((unit, index) => {
    if (index === 0) {
      unit.x = unit.width / 2;
    } else {
      const previous = orderedFocusRow[index - 1];
      unit.x = focusCursor + UNIT_GAP + unit.width / 2;
      if (previous) unit.x = Math.max(unit.x, previous.x + previous.width / 2 + UNIT_GAP + unit.width / 2);
    }
    focusCursor = unit.x + unit.width / 2;
  });
  const focusCorrection = focusUnit.x;
  orderedFocusRow.forEach((unit) => {
    unit.x -= focusCorrection;
  });

  const generationsInTree = [...rows.keys()];
  const minimumGeneration = Math.min(...generationsInTree);
  const maximumGeneration = Math.max(...generationsInTree);

  for (let generation = 1; generation <= maximumGeneration; generation += 1) {
    const row = rows.get(generation) ?? [];
    placeRow(
      row,
      (unit) => {
        const parentXs = [...rawLinks.values()]
          .filter((link) => link.childUnitId === unit.id)
          .map((link) => {
            const parentUnitX = unitMap.get(link.parentUnitId)?.x ?? 0;
            if (link.parentIds.size > 1) return parentUnitX;
            return parentUnitX + personOffsetInUnit([...link.parentIds][0]);
          });
        return average(parentXs);
      },
      profileMap
    );
  }

  for (let generation = -1; generation >= minimumGeneration; generation -= 1) {
    const row = rows.get(generation) ?? [];
    placeRow(
      row,
      (unit) => {
        const childXs = [...rawLinks.values()]
          .filter((link) => link.parentUnitId === unit.id)
          .map((link) =>
            (unitMap.get(link.childUnitId)?.x ?? 0) + personOffsetInUnit(link.childId)
          );
        return average(childXs);
      },
      profileMap
    );
  }

  const people: FamilyLayoutPerson[] = [];
  const positionedUnits: FamilyLayoutUnit[] = workingUnits.map((unit) => {
    const y = unit.generation * FAMILY_GENERATION_GAP;
    const memberOffsets = unit.memberIds.length === 2
      ? [-FAMILY_COUPLE_DISTANCE / 2, FAMILY_COUPLE_DISTANCE / 2]
      : [0];
    const members = unit.memberIds.map((personId, index) => {
      const profile = profileMap.get(personId)!;
      const person: FamilyLayoutPerson = {
        id: profile.id,
        name: profile.full_name,
        dates: formatProfileDates(profile),
        imageUrl: profile.avatar_url ?? undefined,
        admin: profile.role === 'admin',
        isCurrentUser: profile.id === rootId,
        x: unit.x + memberOffsets[index],
        y,
      };
      people.push(person);
      return person;
    });

    return { ...unit, members, y };
  });

  const peopleMap = new Map(people.map((person) => [person.id, person]));
  const positionedUnitMap = new Map(positionedUnits.map((unit) => [unit.id, unit]));
  const links: FamilyLayoutLink[] = [...rawLinks.values()].map((link) => {
    const parentUnit = positionedUnitMap.get(link.parentUnitId)!;
    const child = peopleMap.get(link.childId)!;
    const parentIds = [...link.parentIds];
    const sourceX = parentIds.length > 1
      ? parentUnit.x
      : peopleMap.get(parentIds[0])?.x ?? parentUnit.x;

    return {
      id: `${link.parentUnitId}>${link.childUnitId}>${link.childId}`,
      sourceX,
      sourceY: parentUnit.y + FAMILY_NODE_SIZE / 2,
      targetX: child.x,
      targetY: child.y - FAMILY_NODE_SIZE / 2,
    };
  });

  return {
    units: positionedUnits,
    links,
    people,
    unconnectedCount: profiles.length - connectedIds.size,
  };
}
