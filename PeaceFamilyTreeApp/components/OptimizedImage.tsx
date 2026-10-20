import React from 'react';
import { Image as ExpoImage } from 'expo-image';
import type { ImageProps, ImageSource } from 'expo-image';
import { cssInterop } from 'nativewind';

const StyledImage = cssInterop(ExpoImage, { className: 'style' });

function getRecyclingKey(source: ImageProps['source']): string | undefined {
  if (typeof source === 'string') return source;
  if (!source || typeof source === 'number' || Array.isArray(source)) return undefined;

  return (source as ImageSource).uri ?? undefined;
}

/**
 * App-wide image defaults: persistent caching, downsampling to the rendered size,
 * and a short cross-fade so cached images appear without a visible flash.
 */
export function OptimizedImage({
  source,
  cachePolicy = 'memory-disk',
  transition = 120,
  recyclingKey,
  allowDownscaling = true,
  loading = 'lazy',
  ...props
}: React.ComponentProps<typeof StyledImage>) {
  return (
    <StyledImage
      {...props}
      source={source}
      cachePolicy={cachePolicy}
      transition={transition}
      recyclingKey={recyclingKey ?? getRecyclingKey(source)}
      allowDownscaling={allowDownscaling}
      loading={loading}
    />
  );
}
