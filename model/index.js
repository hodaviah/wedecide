const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User Creditials
const adminSchema = Schema(
	{
		name: String,
		username: {
			type: String,
			unique: true,
			required: true,
		},
		email: {
			type: String,
			unique: true,
			required: true,
		},
		password: String,
		elections: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: "WedecideElections",
				},
			],
			default: [],
		},
		contest: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: "WedecideContests",
				},
			],
			default: [],
		},
	},
	{strict: true, timestamps: true, collection: "WedecideAdmin"}
);

// Election Schema
const electionSchema = Schema(
	{
		admin_id: {type: Schema.Types.ObjectId, ref: "WedecideAdmin"},
		name: {
			type: String,
			unique: true,
		},
		start_date: {
			type: Date,
			default: Date.now,
		},
		end_date: Date,
		reg_start_date: {
			type: Date,
			default: Date.now,
		},
		reg_end_date: Date,
		description: String,
		polls: {
			type: [{type: Schema.Types.ObjectId, ref: "WedecidePolls"}],
			default: [],
		},
		candidates: {
			type: [{type: Schema.Types.ObjectId, ref: "WedecideCandidates"}],
			default: [],
		},
	},
	{
		strict: true,
		collection: "WedecideElections",
		timestamps: true,
	}
);

// Wedecide Poll Schema
const pollSchema = Schema({
	_id: Schema.Types.ObjectId,
	election_id: Schema.Types.ObjectId,
	name: String,
});

// Candidate
const candidateSchema = Schema(
	{
		_id: Schema.Types.ObjectId,
		election_id: {type: Schema.Types.ObjectId, ref: "WedecideElections"},
		poll_id: {type: Schema.Types.ObjectId, ref: "WedecidePolls"},
		name: String,
		vote: Number,
	},
	{
		collection: "WedecideCandidates",
		strict: true,
	}
);

const voterSchema = Schema(
	{
		username: {
			type: String,
			unique: true,
		},
		email: {
			type: String,
			unique: true,
		},
		password: String,
		phone: String,
		voucher: String,
		election_id: Schema.Types.ObjectId,
		face_path: String,
		vote: Number,
	},
	{
		collection: "WedecideVoters",
		strict: true,
	}
);

const contestSchema = Schema(
	{
		admin_id: {type: Schema.Types.ObjectId, ref: "WedecideAdmin"},
		name: {
			type: String,
			unique: true,
		},
		price: {default: 0, type: Number},
		start_date: {
			type: Date,
			defualt: Date.now,
		},
		end_date: Date,
		description: String,
	},
	{
		collection: "WedecideContests",
		strict: true,
	}
);

const contestantPollSchema = Schema(
	{
		contest_id: {
			type: Schema.Types.ObjectId,
			ref: "WedecideContests",
		},
		name: String,
	},
	{
		collection: "WedecideContestantPolls",
		strict: true,
	}
);

const contestantSchema = Schema(
	{
		contest_id: {
			type: Schema.Types.ObjectId,
			ref: "WedecideContests",
		},
		poll_id: {
			type: Schema.Types.ObjectId,
			ref: "WedecidePolls",
		},
		name: String,
		vote: {
			type: Number,
			default: 0,
		},
	},
	{
		collection: "WedecideContestants",
		strict: true,
	}
);

const contestVoterSchema = Schema(
	{
		name: String,
		email: String,
		voucher: String,
		phone: Number,
		contest_id: {
			type: Schema.Types.ObjectId,
			ref: "WedecideContests",
		},
		vote: {
			type: Number,
			default: 0,
		},
	},
	{
		collection: "WedecideContestVoters",
		strict: true,
	}
);

const AdminModel =
	mongoose.model.WedecideAdmin ||
	mongoose.model("WedecideAdmin", adminSchema);

const ElectionModel =
	mongoose.model.WedecideElections ||
	mongoose.model("WedecideElections", electionSchema);

const PollModel =
	mongoose.model.WedecidePolls || mongoose.model("WedecidePolls", pollSchema);

const CandidateModel =
	mongoose.model.WedecideCandidates ||
	mongoose.model("WedecideCandidates", candidateSchema);

const VoterModel =
	mongoose.model.WedecideVoters ||
	mongoose.model("WedecideVoters", voterSchema);

const ContestModel =
	mongoose.model.WedecideContests ||
	mongoose.model("WedecideContests", contestSchema);

const ContestantPollModel =
	mongoose.model.WedecideContestantPolls ||
	mongoose.model("WedecideContestantPolls", contestantPollSchema);

const ContestantModel =
	mongoose.model.WedecideContestants ||
	mongoose.model("WedecideContestants", contestantSchema);

const ContestVoterModel =
	mongoose.model.WedecideContestVoters ||
	mongoose.model("WedecideContestVoter", contestVoterSchema);

module.exports = {
	AdminModel,
	ElectionModel,
	PollModel,
	CandidateModel,
	VoterModel,
	ContestModel,
	ContestantPollModel,
	ContestantModel,
	ContestVoterModel,
};
