const router = require("express").Router();
const mongoose = require("mongoose");
const express = require("express");
const fs = require("fs");
const Models = require("../model");
const formidable = require("formidable");
const {v4: uuidv4} = require("uuid");
const jwt = require("jsonwebtoken");
const verify = require("../config/validateContestVoter");
const verifyElection = require("../config/validateElectionVote");
const path = require("path");
const Emailer = require("../mailer");
const bcrypt = require("bcryptjs");

router.use(express.static("public"));

// Datebase
const db = require("../database/config");
const {render} = require("ejs");
const {promisify} = require("util");

//****************To Register to vote for an election */
router.get("/register-election", async (req, res) => {
	const elections = await Models.ElectionModel.find({}).lean();
	const success = req.flash("success")[0];
	const error = req.flash("error")[0];
	const formData = req.flash("formData")[0];

	console.log({elections, success, error, formData});

	res.render("vote_register", {
		result: elections,
		success,
		error,
		formData,
	});
});

router.post("/register-election", async (req, res) => {
	const form = formidable();
	form.parse(req, async (err, fields, files) => {
		try {
			console.log({err, fields, files});
			if (err) throw Error(err);

			const {election, username, email, phone, password, image_name} =
				fields;
			if (
				!election ||
				!username ||
				!email ||
				!phone ||
				!password ||
				!image_name ||
				!files["image"]
			) {
				req.flash("error", "All Fields Required"),
					req.flash("formData", {...fields, file: files["image"]});
				return res.redirect("/voter/register-election");
			}

			const electionDetail = election.split("/");
			fs.access("./public/uploads", (error) => {
				if (error) {
					fs.mkdirSync("./public/uploads");
				}
			});

			const voucher = `ev-${uuidv4()}`;
			const timestamp = new Date().toISOString().replaceAll(/\W/g, "_");
			const ref = username + "_" + timestamp + path.extname(image_name);

			let upload_path = path.resolve("./public/uploads/" + "/" + ref);
			const fsUpload = promisify(fs.rename);
			await fsUpload(files["image"].filepath, upload_path);

			const salt = bcrypt.genSaltSync(10);
			const hash = bcrypt.hashSync(password, salt);
			const newVoter = new Models.VoterModel({
				username,
				email,
				password: hash,
				voucher,
				phone,
				election_id: electionDetail[0],
				face_path: "/" + ref,
			});

			// const newCandidate = new Models.CandidateModel({
			// 	election_id: electionDetail[0],
			// 	poll_id:
			// })
			await newVoter.save();

			const text = `Good Day ${username}!. \nYou can now partcipate in the election: ${electionDetail[1]} by voting for your favorite candidate, Here is your details \nUsername: ${username} \nPassword: ${password} \nvouchar: ${voucher}`;

			const {error, response} = await Emailer(email, text);
			console.log({error, response});

			if (error)
				throw Error(
					"Error sending Email, We will verify your email later"
				);

			req.flash(
				"success",
				"You can login as a voter of" + electionDetail[1]
			);
			return res.redirect("/voter/vote-election");
		} catch (error) {
			console.log({error});

			if (error.keyValue) {
				req.flash(
					"error",
					Object.keys(error?.keyValue)[0] +
						" - " +
						Object.values(error.keyValue)[0] +
						" already exist"
				);
			} else {
				req.flash("error", error?.message ?? "Internal Server Error");
			}
			req.flash("formData", {...fields, file: files["image"]});

			return res.redirect("/voter/register-election");
		}
	});
});

//************To Login befor you vote for an election */
router.get("/vote-election", async (req, res) => {
	const elections = await Models.ElectionModel.find({}, {name: 1}).lean();
	const success = req.flash("success")[0];
	const error = req.flash("error")[0];
	const formData = req.flash("formData")[0];

	res.render("vote_election", {
		result: elections,
		error,
		success,
		formData,
	});
});

router.post("/vote-election", async (req, res) => {
	const election = req.body.election;
	const username = req.body.username;
	const password = req.body.password;

	if (!election || !username || !password) {
		req.flash("error", "All fields require");
		return res.status(301).redirect("/voter/vote-election");
	}

	const details = election.split("/");
	const VotingElection = await Models.VoterModel.find({
		username: username,
		election_id: mongoose.Types.ObjectId(details[0]),
	}).lean();

	const compare = await bcrypt.compare(
		password,
		VotingElection[0]?.password ?? ""
	);

	if (!VotingElection?.length || !compare) {
		req.flash(
			"error",
			"Invalid Creditials or you have not registered for the election"
		);
		req.flash("formData", req.body);
		return res.status(301).redirect("/voter/vote-election");
	}

	const token = jwt.sign(
		{
			id: VotingElection[0]._id,
			username: VotingElection[0].username,
			election_id: VotingElection[0].election_id,
		},
		"secret-hack-election"
	);
	res.cookie("election_auth", token).redirect("/voter/face-check");
});

router.get("/face-check", verifyElection, async (req, res) => {
	const token = req.cookies.election_auth;
	const votingElection = {...jwt.decode(token, "secret-hack-election")};

	// const voters_username = jwt.decode(token).username;
	// const election_id = jwt.decode(token).election_id;

	const ElectionVotes = await Models.VoterModel.findById(
		votingElection.id
	).lean();

	console.log({ElectionVotes});
	return res.status(200).render("face_check", {result: ElectionVotes});

	// state0 = "SELECT * FROM `voter` WHERE id = ?;";
	// db.query(state0, [voter_id], (err, result) => {
	// 	res.render("face_check", {result});
	// });
});

//****************To Register to vote for an contest */
router.get("/register-contest", async (req, res) => {
	// state1 =
	// 	"SELECT * FROM `contest`WHERE (CURRENT_TIMESTAMP BETWEEN `contest`.`start_date` AND `contest`.`end_date`) AND `contest`.`paid`=1";
	const contests = await Models.ContestModel.find({}).lean();
	res.status(200).render("contest_register", {result: contests});
});

//************To Get info about the voter (Contest) and send an email with his/her vouchar details */
router.post("/contest-register", async (req, res) => {
	const {contest, name, email, phone, cardName, cardNo, mmyy, cvv} = req.body;

	const detailArr = contest.split("/");
	const expArr = mmyy.split("/");
	const expiry_month = expArr[0].trim().toString();
	const expiry_year = expArr[1].trim().toString();
	const contest_id = detailArr[0].trim();
	const contest_name = detailArr[1].trim();
	const voucher = `cv-${uuidv4()}`;

	const newContestVoter = new Models.ContestVoterModel({
		name,
		email,
		phone,
		voucher,
		contest_id,
	});

	await newContestVoter.save();

	const text = `Good Day ${name}! \nYou can now partcipate in the contest: ${contest_name} by voting for your favorite contestant , Here is your vouchar \n${voucher}`;
	const {error, response} = await Emailer(email, text);

	if (error) return console.log(error);

	console.log("Email sent: " + response);
	res.redirect("/voter/contest-vote");
});

//***********************Route to in put the vouchar */
router.get("/contest-vote", (req, res) => {
	res.render("contest_vote");
});

//*******************Verify the Vouchar */
router.post("/contest-vote", (req, res) => {
	const vouchar = req.body.vouchar;

	const userValidStm = "SELECT * FROM `contest_voter` WHERE `voucher` = ?";

	db.query(userValidStm, [vouchar], function (err, result) {
		if (err) throw err;

		if (result.length === 0) {
			res.render("used_vouchar");
		} else if (result[0].vote === 1) {
			res.render("used_vouchar");
		} else {
			const token = jwt.sign(
				{
					id: result[0].contest_id,
					voter_id: result[0].id,
					voter_name: result[0].name,
					voter_email: result[0].email,
				},
				"secret-hack-contest"
			);
			res.cookie("contest_auth", token).redirect("/voter/contest-center");
		}
	});
});

//**********************Route where they will cast vote (Election) */
router.get("/election-center", verifyElection, async (req, res) => {
	const token = req.cookies.election_auth;
	const error = req.flash("error");
	const election_id = jwt.decode(token, "secret-hack-election").election_id;

	const electionDetail = await Models.ElectionModel.findById(
		mongoose.Types.ObjectId(election_id),
		{
			name: 1,
			polls: 1,
			candidates: 1,
		}
	)
		.populate("polls")
		.populate("candidates");

	console.log({electionDetail, election_id, token});

	return res.render("vote_center", {
		result: electionDetail,
		error,
		success: null,
	});

	// state0 = "SELECT `id`, `name` FROM `election` WHERE `id` = ?;";
	// state1 = "SELECT * FROM `poll` WHERE `election_id` = ?;";
	// state2 = "SELECT * FROM `candidate` WHERE candidate.election_id = ?;";

	// statement = state0 + state1 + state2;
	// db.query(
	// 	statement,
	// 	[election_id, election_id, election_id],
	// 	(err, result) => {
	// 		res.render("vote_center", {result});
	// 	}
	// );
});

router.post("/election-center", verifyElection, (req, res) => {
	const token = req.cookies.election_auth;
	const election_id = jwt.decode(token, "secret-hack-election").id;
	// const voters_username = jwt.decode(token).username;
	// const election_id = jwt.decode(token).election_id;
	var newdata = Object.values(req.body);
	console.log({newdata});

	if (newdata.length === 0) {
		req.flash("error", "Vote for at least one contestant");
		res.status(301).redirect("/election-center");
	} else {
		for (let i = 0; i < newdata.length; i++) {
			state = "Select `vote` From `candidate` Where `id` = ?;";
			db.query(state, [newdata[i]], (err, result) => {
				var res = parseInt(result[0].vote);
				res = res + 1;

				vote_state =
					"Update `candidate` Set `vote` = ? Where `id` = ?;";
				db.query(vote_state, [res, newdata[i]], (err, result) => {});
			});
		}
		upstate = "Update `voter` Set `vote` = 1 Where `id` = ?";
		db.query(upstate, [voter_id], (err, result) => {
			if (err) throw err;

			// var mailOptions = {
			//   from: 'wedecideinfo@gmail.com',
			//   to: voter_email,
			//   subject: 'WeDecide Login Details',
			//   text: `Good Day ${voters_username}! \nThank You for partcipating in the contest by voting for your favorite candidate.`,
			// }

			// transporter.sendMail(mailOptions, function (error, info) {
			//   if (error) {
			//     console.log(error)
			//   } else {
			//     console.log('Email sent: ' + info.response)
			//   }
			// })
		});
		res.cookie("election_auth", null);
		res.redirect("/voter/thank-you");
	}
});

//**************** Route where they will cast vote (Contest)*/
router.get("/contest-center", verify, (req, res) => {
	token = req.cookies.contest_auth;
	const id = jwt.decode(token).id;
	voter_id = jwt.decode(token).voter_id;
	console.log(voter_id);
	state0 = "SELECT `id`, `name` FROM `contest` WHERE `id` = ?;";
	state1 = "SELECT * FROM `contestant_poll` WHERE `contest_id` = ?;";
	state2 = "SELECT * FROM `contestant` WHERE contestant.contest_id = ?;";

	statement = state0 + state1 + state2;
	db.query(statement, [id, id, id], (err, result) => {
		res.render("contest_center", {result});
	});
});

//******************People vote for contestant */
router.post("/contest-center", verify, (req, res) => {
	token = req.cookies.contest_auth;
	voter_id = jwt.decode(token).voter_id;
	voter_name = jwt.decode(token).voter_name;
	voter_email = jwt.decode(token).voter_email;
	var newdata = Object.values(req.body);
	if (newdata.length === 0) {
		res.send("Vote for at least one contestant");
	} else {
		for (let i = 0; i < newdata.length; i++) {
			state = "Select `vote` From `contestant` Where `id` = ?;";
			db.query(state, [newdata[i]], (err, result) => {
				var res = parseInt(result[0].vote);
				res = res + 1;

				vote_state =
					"Update `contestant` Set `vote` = ? Where `id` = ?;";
				db.query(vote_state, [res, newdata[i]], (err, result) => {});
			});
		}
		upstate = "Update `contest_voter` Set `vote` = 1 Where `id` = ?";
		db.query(upstate, [voter_id], (err, result) => {
			if (err) throw err;

			var mailOptions = {
				from: "wedecideinfo@gmail.com",
				to: voter_email,
				subject: "WeDecide Login Details",
				text: `Good Day ${voter_name}! \nThank You for partcipating in the contest by voting for your favorite contestant.`,
			};

			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
				} else {
					console.log("Email sent: " + info.response);
				}
			});
		});
		res.cookie("contest_auth", null);
		res.redirect("/voter/thank-you");
	}
});

router.get("/thank-you", (req, res) => {
	res.render("thank_you");
});

module.exports = router;
