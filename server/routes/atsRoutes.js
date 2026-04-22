import express from 'express';
import protect from '../middlewares/authMiddleware.js';
import { checkATS } from '../controllers/atsController.js';

const atsRouter = express.Router();

atsRouter.post('/check', protect, checkATS);

export default atsRouter;