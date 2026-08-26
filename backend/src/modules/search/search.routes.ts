import { Router } from 'express';
import { searchController } from './search.controller';
import { searchAutocompleteLimiter, propertySearchLimiter } from '../../middleware/rateLimiter';
import { validateSearchQuery } from './search.validation';

const router = Router();

// Public Location Intelligence Endpoints (Rate Limited)
router.get('/autocomplete', searchAutocompleteLimiter, searchController.getAutocomplete);
router.get('/locations/autocomplete', searchAutocompleteLimiter, searchController.getAutocomplete);
router.get('/locations/geocode', searchAutocompleteLimiter, searchController.geocode);
router.get('/locations/reverse', searchAutocompleteLimiter, searchController.reverseGeocode);

// Public Property Search Endpoints (Rate Limited & Validated)
router.get('/featured', propertySearchLimiter, searchController.getFeatured);
router.get('/pgs', propertySearchLimiter, validateSearchQuery, searchController.searchPGs);
router.get('/', propertySearchLimiter, validateSearchQuery, searchController.searchPGs);

export { router as searchRoutes };
