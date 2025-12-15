// controllers/cart.controller.js
import { CartService } from "../services/cart.service.js"
import { CartRepository } from "../lib/cart.repository.js"

const cartService = new CartService(new CartRepository())


/**
 * @swagger
 * /cart/{userId}:
 *   get:
 *     summary: Get active cart for a user
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Successfully retrieved active cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: string
 *                 totalamount:
 *                   type: number
 *                 currency:
 *                   type: string
 *       500:
 *         description: Internal server error
 */

export const getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.params.userId)
    res.status(200).json(cart.toJSON())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/**
 * @swagger
 * /cart/{userId}:
 *   put:
 *     summary: Update or create a cart for a user
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cart saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 cart:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalamount:
 *                       type: number
 *                     currency:
 *                       type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */


export const updateCart = async (req, res) => {
  try {
    const { items, currency } = req.body
    const cart = await cartService.updateCart(
      req.params.userId,
      items,
      currency
    )
    res.json(cart)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const clearCart = async (req, res) => {
  try {
    const cart = await cartService.clearCart(req.params.userId)
    res.json(cart)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
