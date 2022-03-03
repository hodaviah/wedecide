const router = require("express").Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const _ = require("lodash");
const Models = require("../model");
const EnsureIsAutheticated = require("../config/validateAdmin");
const mongoose = require("mongoose");
const async = require("async");
// const request = require("request");
// const {initializePayment, EnsureIsAutheticatedPayment} =
// 	require("../config/paystack")(request);

require("../authentication/passport");

//********** Route To The DashBoard ***************/
router.get("/", EnsureIsAutheticated, async (req, res, next) => {
	let elections = [],
		numberOfContest = 0;
	try {
		const token = req.user;
		const userdecode = jwt.decode(token, "secret-hack-admin");

		console.log({userdecode, token});

		const data = await Models.AdminModel.findById(userdecode._id, {
			elections: 1,
			contest: 1,
			name: 1,
			username: 1,
		}).populate("elections");

		async.forEach(data.elections, (election) => {
			console.log({election});
			let editElection = {
				...election._doc,
				polls: election.polls.length ?? 0,
			};
			elections.push(editElection);
		});

		console.log({elections});

		let result = {
			name: data.name,
			username: data.username,
			elections,
			numberOfContest: data.contest.length,
		};

		return res.status(200).render("admin_dashboard", {result});
	} catch (error) {
		console.error({error});
		return res.status(500).send(JSON.stringify(error, null, 3));
	}
});

//****************** The Route To Login In To DashBoard ********************/
router.post("/", async (req, res, next) => {
	const formData = req.body;
	passport.authenticate("localSignin", {
		successRedirect: "/admin",
		failureRedirect: "/login",
		failureFlash: true,
		failureMessage: req.flash("formData", formData),
	})(req, res, next);
});

//******************Logout Section ***************/
router.get("/logout", (req, res) => {
	const user = req?.user;
	const session_user = req.session?.passport?.user;

	if (!user || !session_user) return res.status(404).render("error-404");

	req.logout();
	res.redirect("/");
	return res.end();
});

//****************** The Route To Create An Election ********************/
router.get("/create-election", EnsureIsAutheticated, (req, res) => {
	const success = req.flash("success")[0],
		error = req.flash("error")[0],
		formData = req.flash("formData")[0];
	return res
		.status(200)
		.render("create_election", {error, success, formData});
});

// ******************* Create Election ***********************//
router.post("/create-election", EnsureIsAutheticated, async (req, res) => {
	const formData = req.body;
	const {name, esd, eed, rsd, red, desp} = formData;

	const token = req.user;
	const user_id = jwt.decode(token, "secret-hack-admin")._id;

	console.log({user_id, name, esd, eed, rsd, red, desp});

	if (!name || !esd || !eed || !rsd || !red || !desp) {
		// if any of the field is missing this same page will be render
		// with error
		req.flash("error", "All fields are require");
		req.formData("formData", formData);

		return res.redirect("/admin/create-election");
	} else {
		try {
			const newElection = new Models.ElectionModel({
				admin_id: mongoose.Types.ObjectId(user_id),
				name,
				start_date: esd,
				end_date: eed,
				reg_start_date: rsd,
				reg_end_date: red,
				description: desp,
			});

			console.log({newElection});
			await newElection.save();
			await Models.AdminModel.findByIdAndUpdate(user_id, {
				$push: {elections: newElection._id},
			}).exec();

			req.flash(
				"success",
				`${name} election have been created, check below for more details`
			);
			return res.redirect("/admin/manage-election");
		} catch (error) {
			return res.render("create_election", {
				error:
					error?.keyValue?.name + " election already exist" ??
					"Internal Server Error",
				formData,
				success: null,
			});
		}
		// Check If email exist already
	}
});

//************** Route To Get To All the Election ************/
router.get("/manage-election", EnsureIsAutheticated, async (req, res) => {
	const token = req.user;
	const user_id = jwt.decode(token, "secret-hack-admin")._id;
	const success = req.flash("success")[0];

	console.log({session: req.session, session_id: req.sessionID, success});
	// state1 = "SELECT * FROM `election` WHERE admin_id = ?";

	try {
		// db.query(state1, [user_id], (err, result) => {
		// 	res.render("manage_election", {result});
		// });
		const elections = await Models.ElectionModel.find(
			{
				admin_id: mongoose.Types.ObjectId(user_id),
			},
			{name: 1}
		).lean();

		console.log({elections});
		res.render("manage_election", {
			result: elections,
			success,
			error: false,
		});
	} catch (err) {
		console.log({err});
	}
});

//************** Route To Get To All the Contest ************/
router.get("/create-contest", EnsureIsAutheticated, (req, res) => {
	res.render("create_contest", {
		error: null,
		formData: null,
		success: null,
	});
});

//*******Page to create contest */
router.post("/create-contest", EnsureIsAutheticated, async (req, res) => {
	const {name, esd, eed, desp} = req.body;

	const token = req.user;
	const user_id = jwt.decode(token, "secret-hack-admin")._id;

	console.log({user_id, name, esd, eed, desp});
	if (!name || !esd || !eed || !desp) {
		return res.redirect("/admin/create-contest", {
			error: "All fields Require",
		});
	}

	try {
		const newContest = new Models.ContestModel({
			admin_id: mongoose.Types.ObjectId(user_id),
			name,
			start_date: esd,
			end_date: eed,
			description: desp,
		});

		await newContest.save();

		req.flash(
			"success",
			`${name} contest have been created, check below for more details`
		);
		return res.redirect("/admin/manage-contest");
	} catch (error) {
		console.error({error});
		res.render("create_contest", {
			error:
				error?.keyValue?.name + " contest already exist" ??
				"Internal Server Error",
			formData: req.body,
			success: null,
		});
	}
});

//*******Page to manage contest Edit, Delete Payment and Result */
router.get("/manage-contest", EnsureIsAutheticated, async (req, res) => {
	const token = req.user;
	const user_id = jwt.decode(token, "secret-hack-admin")._id;
	const state1 = "SELECT * FROM `contest` WHERE admin_id = ?";
	const error = req.flash("error")[0];
	const success = req.flash("success")[0];

	console.log({error, success});

	try {
		const contests = await Models.ContestModel.find({
			admin_id: mongoose.Types.ObjectId(user_id),
		}).lean();

		console.log({contests});
		res.render("manage_contest", {result: contests, error, success});
	} catch (err) {
		console.log({...err});
	}
});

//*******************Route to the Election **************/
router.get("/election/:id", EnsureIsAutheticated, (req, res) => {
	id = req.params.id;
	res.cookie("electionState", id);
	state0 = "SELECT * FROM `election` WHERE `id` = ?;";
	state1 = "SELECT * FROM `poll` WHERE `election_id` = ?;";
	state2 =
		"SELECT * FROM `candidate` WHERE candidate.election_id = ? ORDER BY candidate.poll_id;";
	state3 =
		"SELECT * FROM `voter` WHERE voter.election_id = ? ORDER BY `voter`.`reg_date`;";
	statement = state0 + state1 + state2 + state3;
	db.query(statement, [id, id, id, id], (err, result) => {
		//console.log(result)
		res.render("admin_election", {result});
	});
});

//*******************Route to the Election **************/
router.get("/contest/:id", EnsureIsAutheticated, (req, res) => {
	id = req.params.id;
	res.cookie("contestState", id);
	state0 = "SELECT * FROM `contest` WHERE `id` = ?;";
	state1 = "SELECT * FROM `contestant_poll` WHERE `contest_id` = ?;";
	state2 =
		"SELECT * FROM `contestant` WHERE contestant.contest_id = ? ORDER BY contestant.poll_id;";
	state3 =
		"SELECT * FROM `contest_voter` WHERE contest_voter.contest_id = ? ORDER BY `contest_voter`.`reg_date`;";
	statement = state0 + state1 + state2 + state3;
	db.query(statement, [id, id, id, id], (err, result) => {
		//console.log(result)
		res.render("admin_contest", {result});
	});
});

//*********Page to pay a contest */
router.get("/contest/pay/:id", EnsureIsAutheticated, (req, res) => {
	id = req.params.id;
	res.cookie("contestPaid", id);
	res.render("payment_contest_form");
});

//**********Page To Pay an election */
router.get("/election/pay/:id", EnsureIsAutheticated, (req, res) => {
	id = req.params.id;
	res.cookie("electionPaid", id);
	res.render("payment_contest_form");
});

//***********Initialize PayStack Payment System */
router.post("/contest/pay", EnsureIsAutheticated, (req, res) => {
	const form = _.pick(req.body, ["amount", "email", "full_name"]);
	form.metadata = {
		full_name: form.full_name,
	};
	form.amount = 10000 * 100;

	initializePayment(form, (error, body) => {
		if (error) {
			//handle errors
			res.cookie("contestPaid", null);
			res.cookie("electionPaid", null);
			console.log(error);
			return res.redirect("/admin/error");
		}
		response = JSON.parse(body);
		res.redirect(response.data.authorization_url);
	});
});

//********Handles Paystack Callback  */
router.get("/paystack/callback", EnsureIsAutheticated, (req, res) => {
	token = req.cookies.auth;
	user_id = jwt.decode(token).id;
	const contest_id = req.cookies.contestPaid;
	const election_id = req.cookies.electionPaid;

	const ref = req.query.reference;
	EnsureIsAutheticatedPayment(ref, (error, body) => {
		if (error) {
			res.cookie("contestPaid", null);
			res.cookie("electionPaid", null);
			//handle errors appropriately
			console.log(error);
			return res.redirect("/admin/error");
		}
		response = JSON.parse(body);

		const data = _.at(response.data, [
			"reference",
			"amount",
			"customer.email",
			"metadata.full_name",
		]);

		[reference, amount, email, full_name] = data;

		if (contest_id != null) {
			stateC0 =
				"INSERT INTO `receipt` (`ref`, `admin_id`, `contest_id`, `fullname`, `email`) VALUES (?,?,?,?,?);";
			stateC1 = "UPDATE `contest` Set `paid` = 1 Where `id` = ?;";
			stateC = stateC0 + stateC1;
			db.query(
				stateC,
				[reference, user_id, contest_id, full_name, email, contest_id],
				(err, result) => {
					res.cookie("contestPaid", null);
					res.redirect("/admin/success");
				}
			);
		} else if (election_id != null) {
			stateC0 =
				"INSERT INTO `receipt` (`ref`, `admin_id`, `election_id`, `fullname`, `email`) VALUES (?,?,?,?,?);";
			stateC1 = "UPDATE `election` Set `paid` = 1 Where `id` = ?;";
			stateC = stateC0 + stateC1;
			db.query(
				stateC,
				[
					reference,
					user_id,
					election_id,
					full_name,
					email,
					election_id,
				],
				(err, result) => {
					res.cookie("electionPaid", null);
					res.redirect("/admin/success");
				}
			);
		}
	});
});

//**************Success Page After Payment */
router.get("/success", EnsureIsAutheticated, (req, res) => {
	res.render("success_page");
});

//**************Error Page After Payment */
router.get("/error", EnsureIsAutheticated, (req, res) => {
	res.render("error_page");
});

//*************** Handle Add Poll ***********/
router.post("/election/:id/add-poll", EnsureIsAutheticated, (req, res) => {
	const id = req.params.id;
	const name = req.body.name;
	state0 = "Insert Into `poll` (`election_id`,`name`) VALUES (?,?)";
	db.query(state0, [id, name]);
	res.redirect(`/admin/election/${id}`);
});

//*************** Handle Add Candidate ***********/
router.post("/election/:id/add-can", EnsureIsAutheticated, (req, res) => {
	const id = req.params.id;
	const {position, canName} = req.body;
	state0 =
		"Insert Into `candidate` (`election_id`,`poll_id`,`name`, `vote`) VALUES (?,?,?,?)";
	db.query(state0, [id, position, canName, 0]);
	res.redirect(`/admin/election/${id}`);
});

//*************** Handle Add Poll ***********/
router.post("/contest/:id/add-poll", EnsureIsAutheticated, (req, res) => {
	const id = req.params.id;
	const name = req.body.name;
	state0 = "Insert Into `contestant_poll` (`contest_id`,`name`) VALUES (?,?)";
	db.query(state0, [id, name]);
	res.redirect(`/admin/contest/${id}`);
});

//*************** Handle Add Candidate ***********/
router.post("/contest/:id/add-cont", EnsureIsAutheticated, (req, res) => {
	const id = req.params.id;
	const {position, canName} = req.body;
	state0 =
		"Insert Into `contestant` (`contest_id`,`poll_id`,`name`, `vote`) VALUES (?,?,?,?)";
	db.query(state0, [id, position, canName, 0]);
	res.redirect(`/admin/contest/${id}`);
});

//*******Delete An Election */
router.get(
	"/election/delete-election/:id",
	EnsureIsAutheticated,
	(req, res) => {
		id = req.params.id;
		token = req.cookies.auth;
		user_id = jwt.decode(token).id;
		state = "DELETE FROM `election` WHERE `id`= ? AND `admin_id` = ?;";
		db.query(state, [id, user_id], (err, result) => {
			res.redirect("/admin/manage-election");
		});
	}
);

//*******Delete An Poll */
router.get("/election/delete-poll/:id", EnsureIsAutheticated, (req, res) => {
	id = req.params.id;
	token = req.cookies.auth;
	user_id = jwt.decode(token).id;
	electionState = req.cookies.electionState;
	state = "DELETE FROM `poll` WHERE `id`= ?;";
	db.query(state, [id], (err, result) => {
		res.redirect(`/admin/election/${electionState}`);
	});
});

//*******Delete An Candidate */
router.get(
	"/election/delete-candidate/:id",
	EnsureIsAutheticated,
	(req, res) => {
		id = req.params.id;
		token = req.cookies.auth;
		user_id = jwt.decode(token).id;
		electionState = req.cookies.electionState;
		state = "DELETE FROM `candidate` WHERE `id`= ?;";
		db.query(state, [id], (err, result) => {
			res.redirect(`/admin/election/${electionState}`);
		});
	}
);

//*******Delete An Contest */
router.get("/contest/delete-contest/:id", EnsureIsAutheticated, (req, res) => {
	id = req.params.id;
	token = req.cookies.auth;
	user_id = jwt.decode(token).id;
	state = "DELETE FROM `contest` WHERE `id`= ? AND `admin_id` = ?;";
	db.query(state, [id, user_id], (err, result) => {
		res.redirect("/admin/manage-contest");
	});
});

//*******Delete An Categories */
router.get("/contest/delete-category/:id", EnsureIsAutheticated, (req, res) => {
	id = req.params.id;
	token = req.cookies.auth;
	user_id = jwt.decode(token).id;
	contestState = req.cookies.contestState;
	state = "DELETE FROM `contestant_poll` WHERE `id`= ?;";
	db.query(state, [id], (err, result) => {
		res.redirect(`/admin/contest/${contestState}`);
	});
});

//*******Delete An Contestants */
router.get(
	"/contest/delete-contestant/:id",
	EnsureIsAutheticated,
	(req, res) => {
		id = req.params.id;
		token = req.cookies.auth;
		user_id = jwt.decode(token).id;
		contestState = req.cookies.contestState;
		state = "DELETE FROM `contestant` WHERE `id`= ?;";
		db.query(state, [id], (err, result) => {
			res.redirect(`/admin/contest/${contestState}`);
		});
	}
);

module.exports = router;
