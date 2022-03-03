const jwt = require("jsonwebtoken");

// middleware for verifying jwt
module.exports = function auth(req, res, next) {
	try {
		const token = req.cookies.election_auth;

		const verified = jwt.verify(token, "secret-hack-election");
		console.log({token, verified});
		req.id = verified;
		next();
	} catch (err) {
		res.render("vote_election", {
			error: "Access Denied!",
			success: null,
			formData: req.body,
		});
	}
};
