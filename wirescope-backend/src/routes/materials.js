const express = require('express');
const router = express.Router();

// Materials routes - placeholder
router.get('/', async (req, res) => {
  res.json({ success: true, materials: [], message: 'Materials endpoint - coming soon' });
});

router.post('/usage', async (req, res) => {
  res.json({ success: true, message: 'Material usage endpoint - coming soon' });
});

module.exports = router;