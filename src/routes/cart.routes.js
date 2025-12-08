import express from 'express';
import { getCart, updateCart } from '../controllers/cart.controller.js';
import authenticateuser from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:userId', authenticateuser, getCart);
router.post('/:userId', authenticateuser, updateCart);

export default router;
