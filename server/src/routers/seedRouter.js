const express = require('express');
const { seedUser, seedProducts, seedAll } = require('../controllers/seedController');
const seedRouter = express.Router();

seedRouter.get('/users', seedUser);
seedRouter.get('/products', seedProducts);
seedRouter.get('/all', seedAll);

// TEMP DEBUG
seedRouter.get('/test', (req, res) => {
    res.json({ ok: true });
});

module.exports = seedRouter;