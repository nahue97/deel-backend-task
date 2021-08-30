const router = require("express").Router();
const { getAllUnpaid, pay } = require("../controllers/jobs.controllers");

router.get("/unpaid", getAllUnpaid);
router.post("/:job_id/pay", pay);

module.exports = router;