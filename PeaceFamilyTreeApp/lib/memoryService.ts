import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CreateMemoryInput {
  type: 'story' | 'photo' | 'audio';
  title?: string;
  body?: string;
  location?: string;
  imageUris?: string[];   // local file URIs — will be uploaded
  audioUri?: string;      // local file URI or 'mock_audio'
  authorProfileId?: string;
}

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

// ─────────────────────────────────────────────
// 1. Upload a single image to Supabase Storage
//    Returns the public URL or throws on failure
// ─────────────────────────────────────────────

export async function uploadMemoryImage(localUri: string, userId: string): Promise<string> {
  // Read the file as base64
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Derive the file extension from the URI
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

  // Build a unique storage path: {userId}/{timestamp}.{ext}
  const path = `${userId}/${Date.now()}.${ext}`;

  // Convert base64 string to Uint8Array for upload
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error: uploadError } = await supabase.storage
    .from('memory-images')
    .upload(path, bytes, { contentType: mimeType, upsert: false });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('memory-images').getPublicUrl(path);
  return data.publicUrl;
}

// ─────────────────────────────────────────────
// 2. Create a memory row in the DB
//    Handles image uploads internally, returns
//    { id } on success or { error } on failure.
// ─────────────────────────────────────────────

export async function createMemory(
  input: CreateMemoryInput,
  userId: string
): Promise<{ id: string } | { error: string }> {
  try {
    // Upload photos if present
    let imageUrls: string[] = [];
    if (input.imageUris && input.imageUris.length > 0) {
      imageUrls = await Promise.all(
        input.imageUris.map((uri) => uploadMemoryImage(uri, userId))
      );
    }

    const { data, error } = await supabase
      .from('memories')
      .insert({
        created_by: userId,
        author_profile_id: input.authorProfileId ?? null,
        type: input.type,
        title: input.title || null,
        body: input.body || null,
        location: input.location || null,
        image_urls: imageUrls,
        audio_url: input.audioUri && input.audioUri !== 'mock_audio' ? input.audioUri : null,
      })
      .select('id')
      .single();

    if (error || !data) {
      return { error: error?.message ?? 'Failed to create memory' };
    }

    return { id: data.id };
  } catch (err: any) {
    return { error: err?.message ?? 'Unexpected error' };
  }
}

// ─────────────────────────────────────────────
// 3. Fetch all memories (most recent first)
// ─────────────────────────────────────────────

export async function fetchMemories(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchMemories error:', error.message);
    return [];
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// 4. Fetch memories joined with author profile
//    Returns enriched rows ready for the feed
// ─────────────────────────────────────────────

export interface MemoryWithProfile extends Memory {
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export async function fetchMemoriesWithProfiles(): Promise<MemoryWithProfile[]> {
  const { data, error } = await supabase
    .from('memories')
    .select(`
      *,
      profile:profiles!author_profile_id (
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchMemoriesWithProfiles error:', error.message);
    return [];
  }

  return (data ?? []) as MemoryWithProfile[];
}
