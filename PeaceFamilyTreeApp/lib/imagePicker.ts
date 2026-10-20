import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface ImageSourcePickerOptions {
  title?: string;
  multiple?: boolean;
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

type ImageSelectionHandler = (uris: string[]) => void | Promise<void>;

export function showImageSourcePicker(
  options: ImageSourcePickerOptions,
  onSelected: ImageSelectionHandler
) {
  const quality = options.quality ?? 0.82;

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: options.allowsEditing,
      aspect: options.aspect,
      quality,
    });
    if (!result.canceled) await onSelected(result.assets.map((asset) => asset.uri));
  };

  const chooseFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission required', 'Allow photo-library access to choose images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: options.multiple,
      allowsEditing: options.multiple ? false : options.allowsEditing,
      aspect: options.aspect,
      quality,
    });
    if (!result.canceled) await onSelected(result.assets.map((asset) => asset.uri));
  };

  const chooseFromFiles = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: options.multiple,
        copyToCacheDirectory: true,
      });
      if (!result.canceled) await onSelected(result.assets.map((asset) => asset.uri));
    } catch {
      Alert.alert(
        'Rebuild required',
        'Files support was added after this app build was installed. Rebuild and reinstall the app to enable it.'
      );
    }
  };

  Alert.alert(options.title ?? 'Add photo', 'Choose an image source.', [
    { text: 'Camera', onPress: takePhoto },
    { text: 'Photo Library', onPress: chooseFromLibrary },
    { text: 'Files', onPress: chooseFromFiles },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
