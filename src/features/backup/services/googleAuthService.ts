import type * as GoogleSignInTypes from '@react-native-google-signin/google-signin';

const DRIVE_APP_DATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

type GoogleSignInModule = typeof GoogleSignInTypes;

let loadedModule: GoogleSignInModule | null | undefined;

const loadModule = async (): Promise<GoogleSignInModule | null> => {
  if (loadedModule !== undefined) return loadedModule;
  try {
    const module = await import('@react-native-google-signin/google-signin');
    module.GoogleSignin.configure({ webClientId, scopes: [DRIVE_APP_DATA_SCOPE] });
    loadedModule = module;
  } catch {
    loadedModule = null;
  }
  return loadedModule;
};

export async function isGoogleBackupAvailable(): Promise<boolean> {
  if (process.env.EXPO_OS !== 'android' || !webClientId) return false;
  return (await loadModule()) !== null;
}

const requireModule = async (): Promise<GoogleSignInModule> => {
  const module = await loadModule();
  if (!module) throw new Error('O backup no Google Drive não está disponível neste aparelho.');
  return module;
};

export async function signInWithGoogle(): Promise<string | null> {
  const { GoogleSignin, isSuccessResponse } = await requireModule();
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  return isSuccessResponse(response) ? response.data.user.email : null;
}

export async function restoreGoogleSession(): Promise<string | null> {
  const { GoogleSignin } = await requireModule();
  if (!GoogleSignin.hasPreviousSignIn()) return null;
  const response = await GoogleSignin.signInSilently();
  return response.type === 'success' ? response.data.user.email : null;
}

export async function getAccessToken(): Promise<string> {
  const { GoogleSignin } = await requireModule();
  const { accessToken } = await GoogleSignin.getTokens();
  return accessToken;
}

export async function discardAccessToken(token: string): Promise<void> {
  const { GoogleSignin } = await requireModule();
  await GoogleSignin.clearCachedAccessToken(token);
}

export async function signOutOfGoogle(): Promise<void> {
  const { GoogleSignin } = await requireModule();
  await GoogleSignin.signOut();
}
