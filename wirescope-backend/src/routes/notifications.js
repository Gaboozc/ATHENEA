const express = require('express');
const router = express.Router();

// Notifications routes - placeholder
router.get('/', async (req, res) => {
  res.json({ success: true, notifications: [], message: 'Notifications endpoint - coming soon' });
});

router.put('/:id/read', async (req, res) => {
  res.json({ success: true, message: 'Mark notification as read endpoint - coming soon' });
});

module.exports = router;