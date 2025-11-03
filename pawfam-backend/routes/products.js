const express = require('express');
const ProductOrder = require('../models/ProductOrder');
const auth = require('../middleware/auth');
const router = express.Router();

// Create product order
router.post('/orders', auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentInfo, totalAmount } = req.body;

    // Validate required fields
    if (!items || !items.length || !shippingAddress || !paymentInfo || !totalAmount) {
      return res.status(400).json({
        message: 'Please provide all required fields'
      });
    }

    // Validate zip code format (must be numeric and exactly 6 digits)
    if (!/^\d{6}$/.test(shippingAddress.zipCode)) {
      return res.status(400).json({
        message: 'ZIP Code must be exactly 6 digits',
        errors: [{ param: 'shippingAddress.zipCode', msg: 'ZIP Code must be exactly 6 digits' }]
      });
    }

    // Enrich items with vendor info when possible
    const AccessoryProduct = require('../models/AccessoryProduct');
    const enrichedItems = await Promise.all((items || []).map(async (it) => {
      const itemCopy = { ...it };
      try {
        if (it.productId) {
          const prod = await AccessoryProduct.findById(it.productId).lean();
          if (prod && prod.vendor) itemCopy.vendor = prod.vendor;
        }
      } catch (err) {
        // ignore lookup errors
        console.error('Failed to lookup product for vendor enrichment', err.message);
      }
      return itemCopy;
    }));

    const order = new ProductOrder({
      user: req.user._id,
      items: enrichedItems,
      shippingAddress,
      paymentInfo: {
        cardNumber: paymentInfo.cardNumber ? '****' + paymentInfo.cardNumber.slice(-4) : '',
        expiryDate: paymentInfo.expiryDate,
        cvv: '***' // Never store actual CVV
      },
      totalAmount,
      status: 'pending'
    });

    await order.save();

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        _id: order._id,
        items: order.items,
        shippingAddress: order.shippingAddress,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      message: 'Server error creating order',
      error: error.message 
    });
  }
});

// Get user's product orders
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = await ProductOrder.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      message: 'Server error fetching orders',
      error: error.message 
    });
  }
});

// Get single order by ID
router.get('/orders/:id', auth, async (req, res) => {
  try {
    const order = await ProductOrder.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      message: 'Server error fetching order',
      error: error.message 
    });
  }
});

// UPDATE ORDER SHIPPING ADDRESS - NEW ENDPOINT
router.put('/orders/:id/address', auth, async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.email || 
        !shippingAddress.address || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({
        message: 'Please provide complete shipping address'
      });
    }

    // Validate zip code format (must be numeric and exactly 6 digits)
    if (!/^\d{6}$/.test(shippingAddress.zipCode)) {
      return res.status(400).json({
        message: 'ZIP Code must be exactly 6 digits',
        errors: [{ param: 'shippingAddress.zipCode', msg: 'ZIP Code must be exactly 6 digits' }]
      });
    }

    // Find order
    const order = await ProductOrder.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be edited
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        message: 'Cannot edit an order that is delivered or cancelled'
      });
    }

    if (order.status === 'shipped') {
      return res.status(400).json({
        message: 'Cannot edit an order that has already been shipped'
      });
    }

    // Update shipping address
    order.shippingAddress = {
      fullName: shippingAddress.fullName,
      email: shippingAddress.email,
      address: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode
    };

    await order.save();

    res.json({
      message: 'Shipping address updated successfully',
      order
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      message: 'Server error updating address',
      error: error.message
    });
  }
});

// Update order status (for admin/vendor)
router.patch('/orders/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await ProductOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order status updated',
      order
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      message: 'Server error updating status',
      error: error.message 
    });
  }
});

// Cancel order - UPDATED
router.patch('/orders/:id/cancel', auth, async (req, res) => {
  try {
    const order = await ProductOrder.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ 
        message: 'Cannot cancel an order that is already delivered or cancelled' 
      });
    }

    if (order.status === 'shipped') {
      return res.status(400).json({ 
        message: 'Cannot cancel an order that has already been shipped. Please contact support.' 
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ 
      message: 'Server error cancelling order',
      error: error.message 
    });
  }
});

// DELETE ORDER - NEW ENDPOINT
router.delete('/orders/:id', auth, async (req, res) => {
  try {
    const order = await ProductOrder.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Delete the order
    await ProductOrder.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Order deleted successfully',
      deletedOrder: {
        id: order._id,
        totalAmount: order.totalAmount
      }
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      message: 'Server error deleting order',
      error: error.message
    });
  }
});

module.exports = router;