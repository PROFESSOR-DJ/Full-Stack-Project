// Location: pawfam-backend/routes/vendorAccessories.js

const express = require('express');
const AccessoryProduct = require('../models/AccessoryProduct');
const auth = require('../middleware/auth');
const router = express.Router();
const ProductOrder = require('../models/ProductOrder');

// Get all products (public - for users)
router.get('/products', async (req, res) => {
  try {
    const products = await AccessoryProduct.find({ isActive: true })
      .populate('vendor', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// Get vendor's own products
router.get('/my-products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const products = await AccessoryProduct.find({ vendor: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(products);
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// Get single product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const product = await AccessoryProduct.findById(req.params.id)
      .populate('vendor', 'username email');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// Create product
router.post('/products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const {
      name,
      category,
      petType,
      description,
      price,
      discountPrice,
      stock,
      brand,
      specifications,
      images,
      weight,
      dimensions,
      tags,
      shippingInfo
    } = req.body;

    // Validate required fields
    if (!name || !category || !petType || !description || price === undefined || 
        stock === undefined || !brand) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const product = new AccessoryProduct({
      vendor: req.user._id,
      name,
      category,
      petType,
      description,
      price,
      discountPrice,
      stock,
      brand,
      specifications: specifications || [],
      images: images || [],
      weight,
      dimensions,
      tags: tags || [],
      shippingInfo: shippingInfo || {}
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error creating product' });
  }
});

// Update product
router.put('/products/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const product = await AccessoryProduct.findOne({
      _id: req.params.id,
      vendor: req.user._id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    const {
      name,
      category,
      petType,
      description,
      price,
      discountPrice,
      stock,
      brand,
      specifications,
      images,
      weight,
      dimensions,
      tags,
      shippingInfo,
      isFeatured
    } = req.body;

    // Update fields
    if (name) product.name = name;
    if (category) product.category = category;
    if (petType) product.petType = petType;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (discountPrice !== undefined) product.discountPrice = discountPrice;
    if (stock !== undefined) product.stock = stock;
    if (brand) product.brand = brand;
    if (specifications) product.specifications = specifications;
    if (images) product.images = images;
    if (weight) product.weight = weight;
    if (dimensions) product.dimensions = dimensions;
    if (tags) product.tags = tags;
    if (shippingInfo) product.shippingInfo = { ...product.shippingInfo, ...shippingInfo };
    if (isFeatured !== undefined) product.isFeatured = isFeatured;

    await product.save();

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// Delete product
router.delete('/products/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const product = await AccessoryProduct.findOneAndDelete({
      _id: req.params.id,
      vendor: req.user._id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    res.json({
      message: 'Product deleted successfully',
      deletedProduct: {
        id: product._id,
        name: product.name
      }
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

module.exports = router;

// Vendor: get orders for this vendor's products
router.get('/orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    // Orders where any item.vendor matches vendor
    const orders = await ProductOrder.find({ 'items.vendor': req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Also include legacy orders where items.productId belongs to vendor's products
    const myProducts = await AccessoryProduct.find({ vendor: req.user._id }).select('_id').lean();
    const myProductIds = myProducts.map(p => String(p._id));

    if (myProductIds.length > 0) {
      const legacyOrders = await ProductOrder.find({ 'items.productId': { $in: myProductIds } })
        .sort({ createdAt: -1 })
        .lean();

      const map = new Map();
      orders.forEach(o => map.set(String(o._id), o));
      legacyOrders.forEach(o => map.set(String(o._id), o));

      return res.json(Array.from(map.values()));
    }

    res.json(orders);
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({ message: 'Server error fetching vendor orders' });
  }
});