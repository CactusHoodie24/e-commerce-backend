import express from 'express';
import { getCart, updateCart } from '../controllers/cart.controller.js';

const router = express.Router();

router.get('/:userId', getCart);
router.post('/:userId', updateCart);

export default router;
