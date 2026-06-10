import { registerFetcher } from '../core/registry';
import { assetCategoryFetcher } from './assetCategory';
import { assetTagFetcher } from './assetTag';
import { assetVocabularyFetcher } from './assetVocabulary';
import { ddmStructureFetcher } from './ddmStructure';
import { ddmTemplateFetcher } from './ddmTemplate';
import { dmFileEntryFetcher } from './dmFileEntry';
import { dmFolderFetcher } from './dmFolder';
import { journalArticleFetcher } from './journalArticle';
import { journalFolderFetcher } from './journalFolder';
import { layoutFetcher } from './layout';
import { roleFetcher } from './role';
import { themeDisplayFetcher } from './themeDisplay';
import { userFetcher } from './user';

// ── To add a new feature: create a Fetcher file, import it, register it here. ──
export function registerAllFetchers(): void {
  registerFetcher(themeDisplayFetcher);
  registerFetcher(layoutFetcher);
  registerFetcher(journalArticleFetcher);
  registerFetcher(journalFolderFetcher);
  registerFetcher(dmFolderFetcher);
  registerFetcher(dmFileEntryFetcher);
  registerFetcher(ddmStructureFetcher);
  registerFetcher(ddmTemplateFetcher);
  registerFetcher(userFetcher);
  registerFetcher(roleFetcher);
  registerFetcher(assetVocabularyFetcher);
  registerFetcher(assetCategoryFetcher);
  registerFetcher(assetTagFetcher);
}
