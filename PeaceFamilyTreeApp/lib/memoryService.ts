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
  imageUris?: string[]; // local file URIs — will be uploaded
  audioUri?: string; // local file URI or uploaded public URL
  authorProfileId?: string;
}

export type UpdateMemoryInput = Omit<CreateMemoryInput, 'authorProfileId'>;

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
  const uniqueSuffix = Math.random().toString(36).slice(2, 10);
  const path = `${userId}/${Date.now()}-${uniqueSuffix}.${ext}`;

  // Convert base64 string to Uint8Array for upload
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error: uploadError } = await supabase.storage.from('memory-images').upload(path, bytes, {
    contentType: mimeType,
    cacheControl: '31536000',
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('memory-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadMemoryAudio(localUri: string, userId: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const ext = localUri.split('.').pop()?.split('?')[0].toLowerCase() ?? 'm4a';
  const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4';
  const uniqueSuffix = Math.random().toString(36).slice(2, 10);
  const path = `${userId}/${Date.now()}-${uniqueSuffix}.${ext}`;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error: uploadError } = await supabase.storage.from('memory-images').upload(path, bytes, {
    contentType: mimeType,
    cacheControl: '31536000',
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Audio upload failed: ${uploadError.message}`);
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
    // Upload photos and audio before creating the memory row.
    let imageUrls: string[] = [];
    if (input.imageUris && input.imageUris.length > 0) {
      imageUrls = await Promise.all(input.imageUris.map((uri) => uploadMemoryImage(uri, userId)));
    }
    const audioUrl =
      input.type === 'audio' && input.audioUri
        ? /^https?:\/\//i.test(input.audioUri)
          ? input.audioUri
          : await uploadMemoryAudio(input.audioUri, userId)
        : null;

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
        audio_url: audioUrl,
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

export async function fetchMemoryById(memoryId: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('id', memoryId)
    .maybeSingle();

  if (error) {
    console.error('fetchMemoryById error:', error.message);
    return null;
  }

  return data as Memory | null;
}

interface StoredImagePath {
  bucket: 'memory-images' | 'member-media';
  path: string;
}

function getOwnedImagePath(
  url: string,
  userId: string,
  authorProfileId: string | null
): StoredImagePath | null {
  const candidates: { bucket: StoredImagePath['bucket']; ownerPrefix: string }[] = [
    { bucket: 'memory-images', ownerPrefix: userId },
  ];
  if (authorProfileId) {
    candidates.push({ bucket: 'member-media', ownerPrefix: authorProfileId });
  }

  for (const candidate of candidates) {
    const marker = `/storage/v1/object/public/${candidate.bucket}/`;
    const markerIndex = url.indexOf(marker);
    if (markerIndex < 0) continue;

    const encodedPath = url.slice(markerIndex + marker.length).split('?')[0];
    const path = decodeURIComponent(encodedPath);
    if (path.startsWith(`${candidate.ownerPrefix}/`)) {
      return { bucket: candidate.bucket, path };
    }
  }

  return null;
}

export async function updateMemory(
  memoryId: string,
  input: UpdateMemoryInput,
  userId: string
): Promise<{ id: string } | { error: string }> {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('memories')
      .select('id, created_by, author_profile_id, image_urls, audio_url')
      .eq('id', memoryId)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (!existing) return { error: 'Memory not found.' };
    if (existing.created_by !== userId) {
      return { error: 'Only the person who posted this memory can edit it.' };
    }

    const requestedImages = input.type === 'photo' ? (input.imageUris ?? []) : [];
    const existingImages: string[] = Array.isArray(existing.image_urls) ? existing.image_urls : [];
    const existingImageSet = new Set(existingImages);
    const keptImages = requestedImages.filter((uri) => existingImageSet.has(uri));
    const newLocalImages = requestedImages.filter(
      (uri) => !existingImageSet.has(uri) && !/^https?:\/\//i.test(uri)
    );
    const uploadedImages = await Promise.all(
      newLocalImages.map((uri) => uploadMemoryImage(uri, userId))
    );
    const finalImages = [...keptImages, ...uploadedImages];
    const audioUrl =
      input.type === 'audio' && input.audioUri
        ? /^https?:\/\//i.test(input.audioUri)
          ? input.audioUri
          : await uploadMemoryAudio(input.audioUri, userId)
        : null;

    const { data, error } = await supabase
      .from('memories')
      .update({
        type: input.type,
        title: input.title || null,
        body: input.type === 'story' ? input.body || null : null,
        location: input.location || null,
        image_urls: finalImages,
        audio_url: audioUrl,
      })
      .eq('id', memoryId)
      .eq('created_by', userId)
      .select('id')
      .single();

    if (error || !data) return { error: error?.message ?? 'Failed to update memory.' };

    const removedImages = existingImages
      .filter((url) => !finalImages.includes(url))
      .map((url) => getOwnedImagePath(url, userId, existing.author_profile_id))
      .filter((image): image is StoredImagePath => Boolean(image));

    for (const bucket of ['memory-images', 'member-media'] as const) {
      const paths = removedImages
        .filter((image) => image.bucket === bucket)
        .map((image) => image.path);
      if (paths.length > 0) {
        const { error: cleanupError } = await supabase.storage.from(bucket).remove(paths);
        if (cleanupError) {
          console.warn('Memory updated, but removed image cleanup failed:', cleanupError.message);
        }

        if (existing.audio_url && existing.audio_url !== audioUrl) {
          const audioPath = getOwnedImagePath(existing.audio_url, userId, null);
          if (audioPath) {
            const { error: cleanupError } = await supabase.storage
              .from(audioPath.bucket)
              .remove([audioPath.path]);
            if (cleanupError) {
              console.warn(
                'Memory updated, but removed audio cleanup failed:',
                cleanupError.message
              );
            }
          }
        }
      }
    }

    return { id: data.id };
  } catch (error: any) {
    return { error: error?.message ?? 'Unexpected error' };
  }
}

export async function deleteMemory(memoryId: string, userId: string): Promise<{ error?: string }> {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('memories')
      .select('id, created_by, author_profile_id, image_urls, audio_url')
      .eq('id', memoryId)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (!existing) return { error: 'Memory not found.' };
    if (existing.created_by !== userId) {
      return { error: 'Only the person who posted this memory can delete it.' };
    }

    const { data: deleted, error: deleteError } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId)
      .eq('created_by', userId)
      .select('id')
      .maybeSingle();

    if (deleteError) return { error: deleteError.message };
    if (!deleted) return { error: 'Memory could not be deleted.' };

    const storedImages = (Array.isArray(existing.image_urls) ? existing.image_urls : [])
      .map((url) => getOwnedImagePath(url, userId, existing.author_profile_id))
      .filter((image): image is StoredImagePath => Boolean(image));

    for (const bucket of ['memory-images', 'member-media'] as const) {
      const paths = [
        ...new Set(
          storedImages.filter((image) => image.bucket === bucket).map((image) => image.path)
        ),
      ];
      if (paths.length === 0) continue;

      const { error: cleanupError } = await supabase.storage.from(bucket).remove(paths);
      if (cleanupError) {
        console.warn('Memory deleted, but media cleanup failed:', cleanupError.message);
      }

      if (existing.audio_url) {
        const audioPath = getOwnedImagePath(existing.audio_url, userId, null);
        if (audioPath) {
          const { error: cleanupError } = await supabase.storage
            .from(audioPath.bucket)
            .remove([audioPath.path]);
          if (cleanupError) {
            console.warn('Memory deleted, but audio cleanup failed:', cleanupError.message);
          }
        }
      }
    }

    return {};
  } catch (error: any) {
    return { error: error?.message ?? 'Unexpected error' };
  }
}

// ─────────────────────────────────────────────
// 5. Fetch memories joined with author profile
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
    .select(
      `
      *,
      profile:profiles!author_profile_id (
        full_name,
        avatar_url
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchMemoriesWithProfiles error:', error.message);
    return [];
  }

  return (data ?? []) as MemoryWithProfile[];
}
