const LocalStrategy = require("passport-local");
const bodyParser = require("body-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const express = require("express");
const compression = require("compression");
const session = require("cookie-session");
const cors = require("cors");
const User = require("./models/user");
const Cab = require("./models/cab");
const dotenv = require("dotenv");
const IndexRoutes = require("./routes/routes");
const CabRoutes = require("./routes/cabroutes");
const UserRoutes = require("./routes/userroutes");
const seedDB = require("./seed");
const { automaticupdate } = require("./controllers/cabcontroller");

dotenv.config();
const app = express();
const MongodbUrl = process.env.MONGODBURL;
app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true, useNewUrlParser: true }));
app.use(
	bodyParser.urlencoded({
		extended: false,
	})
);
app.use(bodyParser.json());
app.use(
	session({
		secret: "Project is Awesome!",
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate("session"));

mongoose
	.connect(MongodbUrl)
	.then(() => {
		console.log("MongoDB connected");
		seedDB();
	})
	.catch((err) => {
		console.log(err);
	});

passport.use("local", new LocalStrategy(User.authenticate()));
passport.serializeUser((user, done) => {
	done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id);
		if (user) {
			done(null, user);
		} else {
			done(null, false); // No user found
		}
	} catch (err) {
		done(err, null);
	}
});

app.use(IndexRoutes);
app.use("/cab", CabRoutes);

Cab.find()
	.then((cabs) => {
		cabs.forEach((cab) => {
			automaticupdate(cab._id);
		});
	})
	.catch((err) => {
		console.log("Error initializing automatic updates", err);
	});

app.use("/user", UserRoutes);
app.use((req, res) => {
	res.status(404).render("404");
});

app.listen(process.env.PORT, () => {
	console.log(`Server is running on ${process.env.PORT}`);
});
