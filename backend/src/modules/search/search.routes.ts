import { Router } from 'express';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

const searchService = new SearchService();
const searchController = new SearchController(searchService);

const router = Router();

// Public Unauthenticated Search
router.get('/autocomplete', searchController.getAutocomplete);
router.get('/featured', searchController.getFeatured);
router.get('/', searchController.searchPGs);
router.get('/pgs', searchController.searchPGs);

export { router as searchRoutes };
