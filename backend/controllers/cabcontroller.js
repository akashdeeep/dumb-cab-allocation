const Cab = require("../models/cab");

exports.createcab = (req, res) => {
	const { latitude, longitude } = req.body;

	if (!latitude || !longitude) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	const cabobj = new Cab({ latitude, longitude, isCabEmpty: true });
	cabobj
		.save()
		.then((item) => {
			// Start automatic update for the new cab
			exports.automaticupdate(item._id);
			res.json({
				success: true,
				message: "Successfully added cab",
				data: item,
			});
		})
		.catch((err) => {
			console.error("Error", err);
			res.status(500).json({ error: "Internal Server Error" });
		});
};

const change = 0.00002;

exports.automaticupdate = (cabId) => {
	setInterval(() => {
		Cab.findByIdAndUpdate(
			cabId,
			{ $inc: { latitude: change, longitude: change } },
			{ new: true }
		)
			.exec()
			.then((updatedCab) => {
				console.log(
					`Cab ID: ${cabId} - New Location: Latitude ${updatedCab.latitude}, Longitude ${updatedCab.longitude}`
				);
			})
			.catch((err) => {
				console.error(`Error updating cab location for Cab ID: ${cabId}`, err);
			});
	}, 2000); // Update every 2 seconds
};

exports.updatecablocation = (req, res) => {
	const { latitude, longitude, cabId } = req.body;
	Cab.findByIdAndUpdate(cabId, { $set: { latitude, longitude } }, { new: true })
		.exec()
		.then((cabdata) => {
			res.json({
				success: true,
				message: "Suceesfully updated cab location",
			});
		})
		.catch((err) => {
			return res.status(400).json({
				error: "Error",
			});
		});
};
