import {
  CONTENT_MANIFEST,
  validateContentRegistry,
} from '../infrastructure/content/contentRegistry';

export interface BootstrapResult {
  contentVersion: string;
  schemaVersion: number;
}

export function bootstrapApplication(): BootstrapResult {
  validateContentRegistry();
  return {
    contentVersion: CONTENT_MANIFEST.contentVersion,
    schemaVersion: CONTENT_MANIFEST.schemaVersion,
  };
}
