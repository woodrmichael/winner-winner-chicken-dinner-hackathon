import { Image, View } from 'react-native';

export function AppMark({ size = 32 }: { size?: number }) {
  const scale = size / 32;
  return (
    <View style={{ width: size, height: 36 * scale, overflow: 'hidden' }}>
      <Image
        source={require('../../assets/comforce-mke-logo.png')}
        accessibilityLabel="ComForce MKE logo"
        resizeMode="contain"
        style={{ position: 'absolute', width: 224 * scale, height: 61 * scale, left: -19 * scale, top: -4 * scale }}
      />
    </View>
  );
}
