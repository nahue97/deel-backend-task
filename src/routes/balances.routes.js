const router = require("express").Router();
const { depositById } = require("../controllers/balances.controllers");

router.post("/deposit/:userId", depositById);

module.exports = router;