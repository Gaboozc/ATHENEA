const express = require('express');
const router = express.Router();

// Floor plans routes - placeholder
router.get('/', async (req, res) => {
  res.json({ success: true, floorPlans: [], message: 'Floor plans endpoint - coming soon' });
});

router.post('/', async (req, res) => {
  res.json({ success: true, message: 'Upload floor plan endpoint - coming soon' });
});

module.exports = router;