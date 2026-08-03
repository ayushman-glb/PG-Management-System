import { Router } from 'express';
import { SearchController } from './search.controller';

const router = Router();
const controller = new SearchController();

router.get('/', controller.search);

export default router;
