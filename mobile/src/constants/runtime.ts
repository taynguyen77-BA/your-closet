export const frontendBuildSha = process.env.EXPO_PUBLIC_WARDRO_BUILD_SHA?.trim() || 'development';
export const runtimeMode = process.env.EXPO_PUBLIC_WARDRO_RUNTIME_MODE === 'manus' ? 'manus' : 'firebase';
