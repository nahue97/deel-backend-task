const router = require("express").Router();
const { getAll, getById } = require("../controllers/contracts.controllers");

router.get("/", getAll);
router.get("/:id", getById);

module.exports = router;