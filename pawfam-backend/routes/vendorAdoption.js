// Location: pawfam-backend/routes/vendorAdoption.js

const express = require('express');
const AdoptionPet = require('../models/AdoptionPet');
const auth = require('../middleware/auth');
const router = express.Router();
const AdoptionApplication = require('../models/AdoptionApplication');

// Get all adoption pets (public - for users)
router.get('/pets', async (req, res) => {
  try {
    const pets = await AdoptionPet.find({ isActive: true })
      .populate('vendor', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(pets);
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ message: 'Server error fetching pets' });
  }
});

// Get vendor's own adoption pets
router.get('/my-pets', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const pets = await AdoptionPet.find({ vendor: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(pets);
  } catch (error) {
    console.error('Get my pets error:', error);
    res.status(500).json({ message: 'Server error fetching pets' });
  }
});

// Get single pet by ID
router.get('/pets/:id', async (req, res) => {
  try {
    const pet = await AdoptionPet.findById(req.params.id)
      .populate('vendor', 'username email');
    
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    res.json(pet);
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({ message: 'Server error fetching pet' });
  }
});

// Create adoption pet
router.post('/pets', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const {
      name,
      type,
      breed,
      age,
      gender,
      size,
      color,
      description,
      temperament,
      healthStatus,
      shelter,
      adoptionFee,
      specialNeeds,
      goodWith,
      images
    } = req.body;

    // Validate required fields
    if (!name || !type || !breed || !age || !gender || !size || !color || 
        !description || !shelter || adoptionFee === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate shelter information
    if (!shelter.name || !shelter.location || !shelter.address || 
        !shelter.phone || !shelter.email) {
      return res.status(400).json({ message: 'Please provide complete shelter information' });
    }

    const pet = new AdoptionPet({
      vendor: req.user._id,
      name,
      type,
      breed,
      age,
      gender,
      size,
      color,
      description,
      temperament: temperament || [],
      healthStatus: healthStatus || {
        vaccinated: false,
        neutered: false,
        healthConditions: 'Healthy'
      },
      shelter: {
        name: shelter.name,
        location: shelter.location,
        address: shelter.address,
        phone: shelter.phone,
        email: shelter.email
      },
      adoptionFee,
      specialNeeds: specialNeeds || 'None',
      goodWith: goodWith || {
        kids: true,
        dogs: true,
        cats: true
      },
      images: images || []
    });

    await pet.save();

    res.status(201).json({
      message: 'Adoption pet created successfully',
      pet
    });
  } catch (error) {
    console.error('Create pet error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error creating pet' });
  }
});

// Update adoption pet
router.put('/pets/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const pet = await AdoptionPet.findOne({
      _id: req.params.id,
      vendor: req.user._id
    });

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found or unauthorized' });
    }

    const {
      name,
      type,
      breed,
      age,
      gender,
      size,
      color,
      description,
      temperament,
      healthStatus,
      shelter,
      adoptionFee,
      specialNeeds,
      goodWith,
      images,
      status
    } = req.body;

    // Update fields
    if (name) pet.name = name;
    if (type) pet.type = type;
    if (breed) pet.breed = breed;
    if (age) pet.age = age;
    if (gender) pet.gender = gender;
    if (size) pet.size = size;
    if (color) pet.color = color;
    if (description) pet.description = description;
    if (temperament) pet.temperament = temperament;
    if (healthStatus) pet.healthStatus = { ...pet.healthStatus, ...healthStatus };
    if (shelter) pet.shelter = { ...pet.shelter, ...shelter };
    if (adoptionFee !== undefined) pet.adoptionFee = adoptionFee;
    if (specialNeeds !== undefined) pet.specialNeeds = specialNeeds;
    if (goodWith) pet.goodWith = { ...pet.goodWith, ...goodWith };
    if (images) pet.images = images;
    if (status) pet.status = status;

    await pet.save();

    res.json({
      message: 'Adoption pet updated successfully',
      pet
    });
  } catch (error) {
    console.error('Update pet error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error updating pet' });
  }
});

// Delete adoption pet
router.delete('/pets/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const pet = await AdoptionPet.findOneAndDelete({
      _id: req.params.id,
      vendor: req.user._id
    });

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found or unauthorized' });
    }

    res.json({
      message: 'Adoption pet deleted successfully',
      deletedPet: {
        id: pet._id,
        name: pet.name
      }
    });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ message: 'Server error deleting pet' });
  }
});

module.exports = router;

// Vendor: get applications for your pets
router.get('/applications', auth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor role required.' });
    }

    const pets = await AdoptionPet.find({ vendor: req.user._id }).select('_id').lean();
    const petIds = pets.map(p => String(p._id));

    const applications = await AdoptionApplication.find({ 'pet.id': { $in: petIds } })
      .sort({ createdAt: -1 })
      .lean();

    res.json(applications);
  } catch (error) {
    console.error('Get vendor applications error:', error);
    res.status(500).json({ message: 'Server error fetching vendor applications' });
  }
});