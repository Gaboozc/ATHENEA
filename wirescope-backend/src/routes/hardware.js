const express = require('express');
const router = express.Router();

// Hardware routes - placeholder
router.get('/', async (req, res) => {
  res.json({ success: true, hardware: [], message: 'Hardware endpoint - coming soon' });
});

module.exports = router;