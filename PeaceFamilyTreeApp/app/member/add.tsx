import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { Button } from '../../components/Button';
import { useAuth } from '../../lib/auth-context';
import {
  Profile,
  Relationship,
  addMember,
  fetchCurrentUserProfile,
  fetchTreeData,
} from '../../lib/treeService';

type FlowStep = 'relationship' | 'people' | 'shared-parent' | 'details' | 'success';
type RelationshipChoice = 'parent' | 'sibling' | 'spouse' | 'child';
type PersonPickerMode = 'change' | 'extended';

interface RelationshipOption {
  type: RelationshipChoice;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}

const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  { type: 'parent', title: 'Parent', description: 'Mother, father, or parent', icon: 'user' },
  { type: 'sibling', title: 'Brother or sister', description: 'A sibling who shares a parent', icon: 'users' },
  { type: 'spouse', title: 'Partner', description: 'Husband, wife, or partner', icon: 'heart' },
  { type: 'child', title: 'Child', description: 'Son, daughter, or child', icon: 'smile' },
];

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function parentIdsFor(profileId: string, relationships: Relationship[]) {
  return [
    ...new Set(
      relationships.flatMap((relationship) => {
        if (
          relationship.from_profile_id === profileId &&
          relationship.relationship_type === 'parent'
        ) {
          return [relationship.to_profile_id];
        }
        if (
          relationship.to_profile_id === profileId &&
          relationship.relationship_type === 'child'
        ) {
          return [relationship.from_profile_id];
        }
        return [];
      })
    ),
  ];
}

export default function AddMemberScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { user, familyId } = useAuth();
  const params = useLocalSearchParams<{ relativeId?: string; relativeName?: string }>();

  const [step, setStep] = useState<FlowStep>('relationship');
  const [pickerMode, setPickerMode] = useState<PersonPickerMode>('change');
  const [addingExtended, setAddingExtended] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [anchor, setAnchor] = useState<{ id: string; name: string } | null>(
    params.relativeId
      ? { id: params.relativeId, name: params.relativeName || 'this family member' }
      : null
  );
  const [relation, setRelation] = useState<RelationshipChoice | null>(null);
  const [search, setSearch] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [isLiving, setIsLiving] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [sharedParentName, setSharedParentName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingParent, setSavingParent] = useState(false);
  const [error, setError] = useState('');
  const [addedName, setAddedName] = useState('');

  useEffect(() => {
    let active = true;

    const loadContext = async () => {
      if (!user || !familyId) {
        if (active) setLoadingContext(false);
        return;
      }

      try {
        const [currentProfile, treeData] = await Promise.all([
          fetchCurrentUserProfile(user.id),
          fetchTreeData(familyId),
        ]);
        if (!active) return;

        setProfiles(treeData.profiles);
        setRelationships(treeData.relationships);

        if (!params.relativeId && currentProfile) {
          setAnchor({ id: currentProfile.id, name: currentProfile.full_name });
        } else if (params.relativeId && !params.relativeName) {
          const selectedProfile = treeData.profiles.find((profile) => profile.id === params.relativeId);
          if (selectedProfile) {
            setAnchor({ id: selectedProfile.id, name: selectedProfile.full_name });
          }
        }
      } catch (loadError: any) {
        if (active) setError(loadError?.message || 'We could not load your family tree.');
      } finally {
        if (active) setLoadingContext(false);
      }
    };

    loadContext();
    return () => {
      active = false;
    };
  }, [familyId, params.relativeId, params.relativeName, user]);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return profiles
      .filter((profile) => pickerMode === 'change' || profile.id !== anchor?.id)
      .filter((profile) => !query || profile.full_name.toLowerCase().includes(query))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [anchor?.id, pickerMode, profiles, search]);

  const anchorFirstName = anchor ? firstName(anchor.name) : 'them';

  const chooseRelationship = (choice: RelationshipChoice) => {
    if (!anchor) return;
    setError('');
    setRelation(choice);

    if (choice === 'sibling' && parentIdsFor(anchor.id, relationships).length === 0) {
      setStep('shared-parent');
      return;
    }

    setStep('details');
  };

  const openPersonPicker = (mode: PersonPickerMode) => {
    setPickerMode(mode);
    if (mode === 'extended') setAddingExtended(true);
    setSearch('');
    setError('');
    setStep('people');
  };

  const choosePerson = (profile: Profile) => {
    setAnchor({ id: profile.id, name: profile.full_name });
    setRelation(null);
    setSearch('');
    setStep('relationship');
  };

  const handleAddSharedParent = async () => {
    const name = sharedParentName.trim();
    if (!name) {
      setError('Enter the name of the parent you both share.');
      return;
    }
    if (!user || !familyId || !anchor) {
      setError('Your family tree is not ready yet. Please try again.');
      return;
    }

    setSavingParent(true);
    setError('');
    try {
      const result = await addMember(
        { fullName: name, isLiving: true },
        user.id,
        familyId,
        anchor.id,
        'parent'
      );

      if ('error' in result) {
        setError(result.error);
        return;
      }

      setRelationships((current) => [
        ...current,
        {
          id: `local-parent-${result.profileId}`,
          from_profile_id: anchor.id,
          to_profile_id: result.profileId,
          relationship_type: 'parent',
          created_by: user.id,
          created_at: new Date().toISOString(),
        },
      ]);
      setSharedParentName('');
      setStep('details');
    } catch (saveError: any) {
      setError(saveError?.message || 'We could not add the shared parent. Please try again.');
    } finally {
      setSavingParent(false);
    }
  };

  const handleSave = async () => {
    const name = fullName.trim();
    const year = birthYear.trim();

    if (!name) {
      setError('Enter this person’s name.');
      return;
    }
    if (year && !/^\d{4}$/.test(year)) {
      setError('Enter a four-digit birth year, such as 1942.');
      return;
    }
    if (!user || !familyId || !anchor || !relation) {
      setError('Your family tree is not ready yet. Please try again.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const result = await addMember(
        {
          fullName: name,
          dateOfBirth: year ? `${year}-01-01` : null,
          birthPlace: birthPlace.trim() || null,
          isLiving,
        },
        user.id,
        familyId,
        anchor.id,
        relation
      );

      if ('error' in result) {
        setError(result.error);
        return;
      }

      setAddedName(name);
      setStep('success');
    } catch (saveError: any) {
      setError(saveError?.message || 'We could not add this person. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForAnother = () => {
    setRelation(null);
    setAddingExtended(false);
    setFullName('');
    setBirthYear('');
    setBirthPlace('');
    setIsLiving(true);
    setShowDetails(false);
    setAddedName('');
    setError('');
    setStep('relationship');
  };

  const handleBack = () => {
    setError('');
    if (step === 'relationship' || step === 'success') {
      router.back();
      return;
    }
    setStep('relationship');
  };

  const relationshipPhrase = () => {
    if (!relation || !anchor) return '';
    if (relation === 'parent') return `${anchorFirstName}’s parent`;
    if (relation === 'sibling') return `${anchorFirstName}’s brother or sister`;
    if (relation === 'spouse') return `${anchorFirstName}’s partner`;
    return `${anchorFirstName}’s child`;
  };

  const renderAnchor = () => (
    <View className="mb-7 flex-row items-center rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4 dark:border-emerald-900 dark:bg-emerald-950/20">
      <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-900">
        <Text className="text-lg font-bold text-[#064e3b] dark:text-emerald-400">
          {anchor?.name?.[0]?.toUpperCase() || '?'}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm text-emerald-700 dark:text-emerald-500">Related to</Text>
        <Text className="text-[17px] font-bold text-[#12372a] dark:text-white">
          {anchor?.name || 'Your profile'}
        </Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Change family member"
        onPress={() => openPersonPicker('change')}
        className="min-h-11 justify-center rounded-full bg-white px-4 dark:bg-slate-900">
        <Text className="font-bold text-emerald-700 dark:text-emerald-400">Change</Text>
      </TouchableOpacity>
    </View>
  );

  if (step === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-[#fcfcfb] dark:bg-slate-950" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-7">
          <View className="mb-7 h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <Feather name="check" size={44} color="#059669" />
          </View>
          <Text className="text-center text-[30px] font-extrabold text-gray-900 dark:text-white">
            {addedName} was added
          </Text>
          <Text className="mt-3 text-center text-[17px] leading-6 text-gray-500 dark:text-slate-400">
            {relationshipPhrase()} is now in your family tree.
          </Text>
        </View>
        <View className="gap-3 px-6 pb-3">
          <Button title="Done" onPress={() => router.back()} variant="brand" />
          <Button title="Add another family member" onPress={resetForAnother} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#fcfcfb] dark:bg-slate-950" edges={['top']}>
      <View className="flex-row items-center px-5 pb-4 pt-2">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={step === 'relationship' ? 'Close' : 'Go back'}
          onPress={handleBack}
          className="h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-900">
          <Feather
            name={step === 'relationship' ? 'x' : 'chevron-left'}
            size={24}
            color={isDarkMode ? '#e2e8f0' : '#374151'}
          />
        </TouchableOpacity>
        <Text className="ml-4 text-[19px] font-bold text-gray-900 dark:text-white">
          Add a family member
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 pb-16 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {loadingContext && !anchor ? (
            <View className="items-center py-24">
              <ActivityIndicator color="#059669" size="large" />
              <Text className="mt-4 text-base text-gray-500 dark:text-slate-400">
                Opening your family tree…
              </Text>
            </View>
          ) : step === 'relationship' ? (
            <>
              {renderAnchor()}
              <Text className="text-[28px] font-extrabold leading-9 text-gray-900 dark:text-white">
                How is this person related to {anchorFirstName}?
              </Text>
              <Text className="mb-6 mt-2 text-[16px] leading-6 text-gray-500 dark:text-slate-400">
                {addingExtended
                  ? `Choose their closest relationship to ${anchorFirstName}.`
                  : 'Choose the answer that feels most familiar.'}
              </Text>

              <View className="gap-3">
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.title}. ${option.description}`}
                    activeOpacity={0.75}
                    disabled={!anchor || loadingContext}
                    onPress={() => chooseRelationship(option.type)}
                    className="min-h-[82px] flex-row items-center rounded-[24px] border border-gray-100 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
                    <View className="mr-4 h-[52px] w-[52px] items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30">
                      <Feather name={option.icon} size={24} color="#059669" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[18px] font-bold text-gray-900 dark:text-white">
                        {option.title}
                      </Text>
                      <Text className="mt-1 text-[14px] text-gray-500 dark:text-slate-400">
                        {option.description}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={22} color={isDarkMode ? '#64748b' : '#9ca3af'} />
                  </TouchableOpacity>
                ))}

                {!addingExtended && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Extended family. Grandparent, cousin, aunt, uncle, and more"
                    activeOpacity={0.75}
                    disabled={!anchor || loadingContext}
                    onPress={() => openPersonPicker('extended')}
                    className="min-h-[82px] flex-row items-center rounded-[24px] border border-gray-100 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
                    <View className="mr-4 h-[52px] w-[52px] items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/20">
                      <Feather name="grid" size={24} color="#d97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[18px] font-bold text-gray-900 dark:text-white">Extended family</Text>
                      <Text className="mt-1 text-[14px] text-gray-500 dark:text-slate-400">
                        Grandparent, cousin, aunt, uncle, and more
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={22} color={isDarkMode ? '#64748b' : '#9ca3af'} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : step === 'people' ? (
            <>
              <Text className="text-[28px] font-extrabold leading-9 text-gray-900 dark:text-white">
                {pickerMode === 'extended' ? 'Who connects them to your tree?' : 'Who are they related to?'}
              </Text>
              <Text className="mb-6 mt-2 text-[16px] leading-6 text-gray-500 dark:text-slate-400">
                {pickerMode === 'extended'
                  ? 'Choose the closest family member already in your tree. For a cousin, this might be their parent.'
                  : 'Choose a person already in your family tree.'}
              </Text>

              <View className="mb-5 flex-row items-center rounded-2xl border border-gray-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
                <Feather name="search" size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search family members"
                  placeholderTextColor={isDarkMode ? '#64748b' : '#9ca3af'}
                  className="ml-3 h-14 flex-1 text-[17px] text-gray-900 dark:text-white"
                  autoFocus
                  returnKeyType="search"
                />
              </View>

              <View className="gap-2">
                {filteredProfiles.map((profile) => (
                  <TouchableOpacity
                    key={profile.id}
                    onPress={() => choosePerson(profile)}
                    className="min-h-[68px] flex-row items-center rounded-2xl bg-white px-4 dark:bg-slate-900">
                    <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                      <Text className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                        {profile.full_name[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <Text className="flex-1 text-[17px] font-semibold text-gray-900 dark:text-white">
                      {profile.full_name}
                    </Text>
                    <Feather name="chevron-right" size={20} color={isDarkMode ? '#64748b' : '#9ca3af'} />
                  </TouchableOpacity>
                ))}
                {!filteredProfiles.length && (
                  <Text className="py-10 text-center text-base text-gray-500 dark:text-slate-400">
                    {search.trim()
                      ? 'No family member matches that name.'
                      : 'There are no other family members to connect through yet.'}
                  </Text>
                )}
              </View>
            </>
          ) : step === 'shared-parent' ? (
            <>
              <View className="mb-6 h-16 w-16 items-center justify-center rounded-[22px] bg-emerald-50 dark:bg-emerald-950/30">
                <Feather name="users" size={30} color="#059669" />
              </View>
              <Text className="text-[28px] font-extrabold leading-9 text-gray-900 dark:text-white">
                First, who is the parent you both share?
              </Text>
              <Text className="mb-7 mt-3 text-[16px] leading-6 text-gray-500 dark:text-slate-400">
                A shared parent connects brothers and sisters correctly in the tree. We’ll add the sibling next.
              </Text>

              <Text className="mb-2 text-base font-bold text-gray-800 dark:text-slate-200">Parent’s name</Text>
              <TextInput
                value={sharedParentName}
                onChangeText={(value) => {
                  setSharedParentName(value);
                  setError('');
                }}
                placeholder="For example, Grace Peace"
                placeholderTextColor={isDarkMode ? '#64748b' : '#9ca3af'}
                autoCapitalize="words"
                autoFocus
                returnKeyType="next"
                onSubmitEditing={handleAddSharedParent}
                className="h-16 rounded-2xl border border-gray-200 bg-white px-5 text-[18px] text-gray-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />

              {error ? <Text className="mt-3 text-[15px] text-red-600">{error}</Text> : null}

              <View className="mt-7">
                <Button
                  title="Add parent and continue"
                  onPress={handleAddSharedParent}
                  loading={savingParent}
                  disabled={!sharedParentName.trim()}
                />
              </View>
            </>
          ) : (
            <>
              {renderAnchor()}
              <View className="mb-5 self-start rounded-full bg-emerald-100 px-4 py-2 dark:bg-emerald-950/40">
                <Text className="font-bold text-emerald-800 dark:text-emerald-400">{relationshipPhrase()}</Text>
              </View>
              <Text className="text-[28px] font-extrabold leading-9 text-gray-900 dark:text-white">
                What is their name?
              </Text>
              <Text className="mb-5 mt-2 text-[16px] leading-6 text-gray-500 dark:text-slate-400">
                A name is all you need. You can add the rest later.
              </Text>

              <TextInput
                value={fullName}
                onChangeText={(value) => {
                  setFullName(value);
                  setError('');
                }}
                placeholder="Full name"
                placeholderTextColor={isDarkMode ? '#64748b' : '#9ca3af'}
                autoCapitalize="words"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
                className="h-16 rounded-2xl border-2 border-emerald-600 bg-white px-5 text-[19px] text-gray-900 dark:bg-slate-900 dark:text-white"
              />

              <TouchableOpacity
                onPress={() => setShowDetails((current) => !current)}
                className="mt-4 min-h-12 flex-row items-center justify-center">
                <Text className="mr-2 text-[16px] font-bold text-emerald-700 dark:text-emerald-400">
                  {showDetails ? 'Hide optional details' : 'Add optional details'}
                </Text>
                <Feather name={showDetails ? 'chevron-up' : 'chevron-down'} size={20} color="#059669" />
              </TouchableOpacity>

              {showDetails && (
                <View className="mt-5 rounded-[24px] border border-gray-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <Text className="mb-2 text-base font-bold text-gray-800 dark:text-slate-200">Birth year</Text>
                  <TextInput
                    value={birthYear}
                    onChangeText={(value) => setBirthYear(value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="For example, 1942"
                    placeholderTextColor={isDarkMode ? '#64748b' : '#9ca3af'}
                    keyboardType="number-pad"
                    maxLength={4}
                    className="mb-5 h-14 rounded-2xl bg-gray-50 px-4 text-[17px] text-gray-900 dark:bg-slate-950 dark:text-white"
                  />

                  <Text className="mb-2 text-base font-bold text-gray-800 dark:text-slate-200">Birthplace</Text>
                  <TextInput
                    value={birthPlace}
                    onChangeText={setBirthPlace}
                    placeholder="Town, city, or country"
                    placeholderTextColor={isDarkMode ? '#64748b' : '#9ca3af'}
                    autoCapitalize="words"
                    className="mb-5 h-14 rounded-2xl bg-gray-50 px-4 text-[17px] text-gray-900 dark:bg-slate-950 dark:text-white"
                  />

                  <Text className="mb-3 text-base font-bold text-gray-800 dark:text-slate-200">
                    Is this person living?
                  </Text>
                  <View className="flex-row gap-3">
                    {[
                      { label: 'Yes', value: true },
                      { label: 'No', value: false },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.label}
                        onPress={() => setIsLiving(option.value)}
                        className={`h-14 flex-1 items-center justify-center rounded-2xl border-2 ${
                          isLiving === option.value
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-slate-950'
                        }`}>
                        <Text
                          className={`text-[17px] font-bold ${
                            isLiving === option.value
                              ? 'text-emerald-800 dark:text-emerald-400'
                              : 'text-gray-500 dark:text-slate-400'
                          }`}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {error ? <Text className="mt-4 text-center text-[15px] text-red-600">{error}</Text> : null}

              <View className="mt-7">
                <Button
                  title={fullName.trim() ? `Add ${firstName(fullName)}` : 'Add to family tree'}
                  onPress={handleSave}
                  loading={saving}
                  disabled={!fullName.trim()}
                  icon="user-plus"
                />
              </View>
            </>
          )}

          {step === 'relationship' && error ? (
            <Text className="mt-5 text-center text-[15px] text-red-600">{error}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
