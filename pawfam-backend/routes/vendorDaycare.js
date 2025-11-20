// Location: pawfam-backend/routes/vendorDaycare.js

const express = require('express');
const DaycareCenter = require('../models/DaycareCenter');
const auth = require('../middleware/auth');
const router = express.Router();
const DaycareBooking = require('../models/DaycareBooking');

// Get all daycare centers (public - for users)
router.get('/centers', async (req, res) => {
  try {
    const centers = await DaycareCenter.find({ isActive: true })
      .populate('vendor', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(centers);
  } catch (error) {
    console.error('Get centers error:', error);
    res.status(500).json({ message: 'Server error fetching centers' });
  }
});

// Get vendor's own daycare centers
router.get('/my-centers', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const centers = await DaycareCenter.find({ vendor: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(centers);
  } catch (error) {
    console.error('Get my centers error:', error);
    res.status(500).json({ message: 'Server error fetching centers' });
  }
});

// Get single center by ID
router.get('/centers/:id', async (req, res) => {
  try {
    const center = await DaycareCenter.findById(req.params.id)
      .populate('vendor', 'username email');
    
    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }

    res.json(center);
  } catch (error) {
    console.error('Get center error:', error);
    res.status(500).json({ message: 'Server error fetching center' });
  }
});

// Create daycare center
router.post('/centers', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const {
      name,
      location,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      pricePerDay,
      services,
      petTypes,
      facilities,
      capacity,
      description,
      operatingHours,
      images
    } = req.body;

    // Validate required fields
    if (!name || !location || !address || !city || !state || !zipCode || 
        !phone || !email || !pricePerDay || !capacity || !description || !operatingHours) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate image size if provided (limit to 5MB per image)
    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img && img.length > 7000000) { // ~5MB in base64
          return res.status(400).json({ 
            message: 'Image size too large. Please use images under 5MB.' 
          });
        }
      }
    }

    const center = new DaycareCenter({
      vendor: req.user._id,
      name,
      location,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      pricePerDay,
      services: services || [],
      petTypes: petTypes || [],
      facilities: facilities || [],
      capacity,
      description,
      operatingHours,
      images: images || []
    });

    await center.save();

    res.status(201).json({
      message: 'Daycare center created successfully',
      center
    });
  } catch (error) {
    console.error('Create center error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error creating center' });
  }
});

// Update daycare center
router.put('/centers/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const center = await DaycareCenter.findOne({
      _id: req.params.id,
      vendor: req.user._id
    });

    if (!center) {
      return res.status(404).json({ message: 'Center not found or unauthorized' });
    }

    const {
      name,
      location,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      pricePerDay,
      services,
      petTypes,
      facilities,
      capacity,
      description,
      operatingHours,
      images
    } = req.body;

    // Validate image size if provided
    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img && img.length > 7000000) {
          return res.status(400).json({ 
            message: 'Image size too large. Please use images under 5MB.' 
          });
        }
      }
    }

    // Update fields
    if (name) center.name = name;
    if (location) center.location = location;
    if (address) center.address = address;
    if (city) center.city = city;
    if (state) center.state = state;
    if (zipCode) center.zipCode = zipCode;
    if (phone) center.phone = phone;
    if (email) center.email = email;
    if (pricePerDay !== undefined) center.pricePerDay = pricePerDay;
    if (services) center.services = services;
    if (petTypes) center.petTypes = petTypes;
    if (facilities) center.facilities = facilities;
    if (capacity !== undefined) center.capacity = capacity;
    if (description) center.description = description;
    if (operatingHours) center.operatingHours = operatingHours;
    if (images !== undefined) center.images = images;

    await center.save();

    res.json({
      message: 'Daycare center updated successfully',
      center
    });
  } catch (error) {
    console.error('Update center error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error updating center' });
  }
});

// Delete daycare center
router.delete('/centers/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const center = await DaycareCenter.findOneAndDelete({
      _id: req.params.id,
      vendor: req.user._id
    });

    if (!center) {
      return res.status(404).json({ message: 'Center not found or unauthorized' });
    }

    res.json({
      message: 'Daycare center deleted successfully',
      deletedCenter: {
        id: center._id,
        name: center.name
      }
    });
  } catch (error) {
    console.error('Delete center error:', error);
    res.status(500).json({ message: 'Server error deleting center' });
  }
});

// Get bookings for vendor's daycare centers
router.get('/bookings', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const centers = await DaycareCenter.find({ vendor: req.user._id }).lean();
    const centerIds = centers.map(c => c._id).filter(Boolean);
    const centerNames = centers.map(c => c.name).filter(Boolean);

    const query = {
      $or: [
        { vendor: req.user._id },
        { daycareCenterId: { $in: centerIds } },
        { 'daycareCenter.name': { $in: centerNames } }
      ]
    };

    const bookings = await DaycareBooking.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(bookings);
  } catch (error) {
    console.error('Get vendor bookings error:', error);
    res.status(500).json({ message: 'Server error fetching vendor bookings' });
  }
});

module.exports = router;