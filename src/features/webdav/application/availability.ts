import type {
  WebdavPermissionState,
  WebdavProfile,
} from '@/adapters/local-persistence/contracts';

export function normalizeWebdavEndpointUrl(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    if (
      (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
      parsed.username.length > 0 ||
      parsed.password.length > 0
    ) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function deriveWebdavOriginPattern(endpointUrl: string): string | null {
  const normalized = normalizeWebdavEndpointUrl(endpointUrl);
  if (!normalized) {
    return null;
  }

  const parsed = new URL(normalized);
  return `${parsed.protocol}//${parsed.host}/`;
}

export function isWebdavProfileConfigured(
  profile: WebdavProfile | null,
): profile is WebdavProfile {
  return (
    profile !== null &&
    normalizeWebdavEndpointUrl(profile.endpointUrl) !== null &&
    profile.username.trim().length > 0 &&
    profile.password.length > 0
  );
}

export function hasGrantedWebdavHostPermission(
  profile: WebdavProfile | null,
  permissionState: WebdavPermissionState | null,
): boolean {
  if (!isWebdavProfileConfigured(profile) || permissionState === null || !permissionState.granted) {
    return false;
  }

  return deriveWebdavOriginPattern(profile.endpointUrl) === permissionState.origin;
}

export function didLatestWebdavTestSucceed(profile: WebdavProfile | null): boolean {
  return profile?.lastTestStatus === 'success' && typeof profile.lastTestedAt === 'string';
}

export function isWebdavUploadReady(input: {
  profile: WebdavProfile | null;
  permissionState: WebdavPermissionState | null;
}): boolean {
  return (
    isWebdavProfileConfigured(input.profile) &&
    hasGrantedWebdavHostPermission(input.profile, input.permissionState) &&
    didLatestWebdavTestSucceed(input.profile)
  );
}
