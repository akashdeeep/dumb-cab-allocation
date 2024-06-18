const User = require("../models/user");
const Cab = require("../models/cab");
const geolib = require("geolib");
const passport = require("passport");

const change = 0.00002;
const thresholdDis = 500000;
const maxcabs = 3;

exports.booknearestcab = async (req, res) => {
	const { latitude, longitude, userId } = req.body;

	if (!latitude || !longitude || !userId) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	try {
		let minDis = Infinity;
		let cabID = null;

		const cabs = await Cab.find({ isCabEmpty: true });
		if (!cabs.length) {
			return res.status(404).json({ error: "No available cabs" });
		}

		cabs.forEach((doc) => {
			const cabDistance = geolib.getDistance(
				{ latitude, longitude },
				{ latitude: doc.latitude, longitude: doc.longitude }
			);
			if (cabDistance < minDis) {
				minDis = cabDistance;
				cabID = doc._id;
			}
		});

		if (minDis === Infinity) {
			return res.status(404).json({ error: "No available cabs nearby" });
		}

		const user = await User.findByIdAndUpdate(
			userId,
			{ $set: { assignedCabId: cabID } },
			{ new: true }
		).exec();
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const cab = await Cab.findByIdAndUpdate(
			cabID,
			{ $set: { isCabEmpty: false } },
			{ new: true }
		).exec();
		res.json({
			success: true,
			message: "Successfully assigned nearest cab",
			data: cab,
		});
	} catch (err) {
		console.error("Error", err);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

exports.shownearbycabs = async (req, res) => {
	const { latitude, longitude } = req.body;

	if (!latitude || !longitude) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	try {
		const cabs = await Cab.find({ isCabEmpty: true });
		const nearbyCabs = cabs
			.map((doc) => {
				const cabDistance = geolib.getDistance(
					{ latitude, longitude },
					{ latitude: doc.latitude, longitude: doc.longitude }
				);
				return {
					cabId: doc._id,
					latitude: doc.latitude,
					longitude: doc.longitude,
					distance: cabDistance,
				};
			})
			.filter((cab) => cab.distance <= thresholdDis);

		// Sort by distance and take the top maxcabs
		nearbyCabs.sort((a, b) => a.distance - b.distance);
		const topNearbyCabs = nearbyCabs.slice(0, maxcabs);

		res.json({
			success: true,
			message: "Successfully fetched nearby cabs",
			data: topNearbyCabs,
		});
	} catch (err) {
		console.error("Error", err);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

exports.registeruser = (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	const newUser = new User({ username });
	User.register(newUser, password)
		.then((user) => {
			passport.authenticate("userlocal")(req, res, () => {
				res.json({ success: true, message: "User successfully registered" });
			});
		})
		.catch((err) => {
			console.error("Error", err);
			res.status(500).json({ error: "Internal Server Error" });
		});
};

exports.loginuser = (req, res, next) => {
	passport.authenticate("local", (error, user, message) => {
		if (error) {
			console.error("Error", error);
			return res.status(500).json({ message: "Internal Server Error" });
		}
		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}
		req.login(user, (err) => {
			if (err) {
				console.error("Error", err);
				return res.status(500).json({ message: "Failed to login" });
			}
			res.json({ success: true, userId: req.user._id });
		});
	})(req, res, next);
};
