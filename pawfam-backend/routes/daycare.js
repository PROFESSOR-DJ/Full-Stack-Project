const express = require('express');
const DaycareBooking = require('../models/DaycareBooking');
const auth = require('../middleware/auth');
const router = express.Router();

// Create daycare booking
router.post('/bookings', auth, async (req, res) => {
  try {
    const {
      daycareCenter,
      daycareCenterId,
      petName,
      petType,
      petAge,
      email,
      mobileNumber,
      startDate,
      endDate,
      specialInstructions,
      totalAmount
    } = req.body;

    // Validate required fields
    if (!petName || !petType || !petAge || !email || !mobileNumber || !startDate || !endDate || !totalAmount) {
      return res.status(400).json({
        message: 'Please provide all required fields including email and mobile number'
      });
    }

    // If daycareCenterId is provided, fetch the center to attach id/vendor info
    let centerInfo = daycareCenter;
    let daycareCenterIdToSave = null;
    let vendorForBooking = null;

    if (daycareCenterId) {
      const DaycareCenter = require('../models/DaycareCenter');
      const center = await DaycareCenter.findById(daycareCenterId).lean();
      if (center) {
        centerInfo = {
          name: center.name,
          location: center.location,
          pricePerDay: center.pricePerDay
        };
        daycareCenterIdToSave = center._id;
        vendorForBooking = center.vendor;
      }
    }

    const booking = new DaycareBooking({
      user: req.user._id,
      daycareCenter: centerInfo,
      daycareCenterId: daycareCenterIdToSave,
      vendor: vendorForBooking,
      petName,
      petType,
      petAge,
      email,
      mobileNumber,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      specialInstructions: specialInstructions || '',
      totalAmount,
      status: 'pending'
    });

    await booking.save();

    res.status(201).json({
      message: 'Daycare booking created successfully',
      booking: {
        _id: booking._id,
        daycareCenter: booking.daycareCenter,
        daycareCenterId: booking.daycareCenterId,
        vendor: booking.vendor,
        petName: booking.petName,
        petType: booking.petType,
        petAge: booking.petAge,
        email: booking.email,
        mobileNumber: booking.mobileNumber,
        startDate: booking.startDate,
        endDate: booking.endDate,
        specialInstructions: booking.specialInstructions,
        totalAmount: booking.totalAmount,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      }
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      message: 'Server error creating booking',
      error: error.message
    });
  }
});

// Get user's daycare bookings
router.get('/bookings', auth, async (req, res) => {
  try {
    const { search } = req.query;

    let query = { user: req.user._id };

    // If search keyword is provided, add search criteria
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      query.$or = [
        { petName: searchRegex },
        { petType: searchRegex },
        { 'daycareCenter.name': searchRegex },
        { 'daycareCenter.location': searchRegex },
        { specialInstructions: searchRegex },
        { status: searchRegex },
        { email: searchRegex },
        { mobileNumber: searchRegex }
      ];
    }

    const bookings = await DaycareBooking.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      message: 'Server error fetching bookings',
      error: error.message
    });
  }
});

// Get single booking by ID
router.get('/bookings/:id', auth, async (req, res) => {
  try {
    const booking = await DaycareBooking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      message: 'Server error fetching booking',
      error: error.message
    });
  }
});

// UPDATE BOOKING - NEW ENDPOINT
router.put('/bookings/:id', auth, async (req, res) => {
  try {
    const {
      petName,
      petType,
      petAge,
      email,
      mobileNumber,
      startDate,
      endDate,
      specialInstructions
    } = req.body;

    // Find booking
    const booking = await DaycareBooking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking can be edited
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        message: 'Cannot edit a booking that is completed or cancelled'
      });
    }

    // Calculate new total amount if dates changed
    let totalAmount = booking.totalAmount;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      totalAmount = days * booking.daycareCenter.pricePerDay;
    }

    // Update booking fields
    if (petName) booking.petName = petName;
    if (petType) booking.petType = petType;
    if (petAge) booking.petAge = petAge;
    if (email) booking.email = email;
    if (mobileNumber) booking.mobileNumber = mobileNumber;
    if (startDate) booking.startDate = new Date(startDate);
    if (endDate) booking.endDate = new Date(endDate);
    if (specialInstructions !== undefined) booking.specialInstructions = specialInstructions;
    booking.totalAmount = totalAmount;

    await booking.save();

    res.json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      message: 'Server error updating booking',
      error: error.message
    });
  }
});

// Update booking status (for admin/vendor)
router.patch('/bookings/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await DaycareBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      message: 'Booking status updated',
      booking
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      message: 'Server error updating status',
      error: error.message
    });
  }
});

// Cancel booking (Revoke)
router.patch('/bookings/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await DaycareBooking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        message: 'Cannot cancel a booking that is already completed or cancelled'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      message: 'Server error cancelling booking',
      error: error.message
    });
  }
});

// Delete booking - UPDATED to handle cancelled status
router.delete('/bookings/:id', auth, async (req, res) => {
  try {
    const booking = await DaycareBooking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Delete the booking
    await DaycareBooking.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Booking deleted successfully',
      deletedBooking: {
        id: booking._id,
        petName: booking.petName
      }
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      message: 'Server error deleting booking',
      error: error.message
    });
  }
});

module.exports = router;