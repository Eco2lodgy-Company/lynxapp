import { getDefaultConfig } from 'expo/metro-config';
import { withNativeWind } from 'nativewind/metro';

const config = getDefaultConfig(import.meta.dirname || '.');

export default withNativeWind(config, { input: './global.css' });
