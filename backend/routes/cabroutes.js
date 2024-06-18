const express = require("express");
const router = express.Router({ mergeParams: true });
const isLoggedIn = require("../middleware/middleware");
const {
	createcab,
	updatecablocation,
	automaticupdate,
} = require("../controllers/cabcontroller");

router.post("/create", isLoggedIn, createcab);
router.post("/updatelocation", isLoggedIn, updatecablocation);
router.post("/automaticupdate", isLoggedIn, (req, res) => {
	const { cabId } = req.body;
	if (!cabId) {
		return res.status(400).json({ error: "Missing cabId" });
	}
	automaticupdate(cabId);
	res.json({ success: true, message: "Automatic update started" });
});

module.exports = router;
