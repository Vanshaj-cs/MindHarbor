import { Schema, model } from "mongoose";

const ProfileSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
		unique: true,
	},
	// Personal Information
	firstName: String,
	lastName: String,
	email: String,
	gender: {
		type: String,
		enum: ["male", "female", "other", "prefer-not-to-say"],
	},
	dob: Date,
	bloodGroup: {
		type: String,
		enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
	},
	disability: {
		type: String,
		enum: ["yes", "no"],
	},
	disabilityDetails: String,
	height: Number, // in cm
	weight: Number, // in kg

	// Address Details
	district: String,
	state: String,
	pincode: String,

	// Academic Information
	currentStatus: {
		type: String,
		enum: ["job", "ug", "pg", "12th", "below-12"],
	},
	collegeName: String,
	courseName: String,
	courseDuration: {
		type: Number,
		min: 1,
		max: 6,
	},
	currentYear: {
		type: Number,
		min: 1,
		max: 6,
	},
	expectedCompletion: Number,
	backlogs: {
		type: String,
		enum: ["yes", "no"],
	},
	backlogSubjects: Number,
	studyMode: {
		type: String,
		enum: ["regular", "online", "hybrid"],
	},

	// Current Residence
	livingWithParents: {
		type: String,
		enum: ["yes", "no"],
	},
	livingIn: {
		type: String,
		enum: ["hostel", "pg", "rented", "other"],
	},
	collegeDistance: Number, // in km

	// Health & Wellness
	sleepPattern: {
		type: String,
		enum: ["<4", "4-6", "6-8", ">8"],
	},
	exerciseHabit: {
		type: String,
		enum: ["yes", "no"],
	},
	exerciseFreq: {
		type: String,
		enum: ["daily", "weekly", "occasionally"],
	},
	smokingDrinking: {
		type: String,
		enum: ["yes", "no"],
	},
	mentalHealthCondition: {
		type: String,
		enum: ["anxiety", "depression", "none", "prefer-not-to-say"],
	},
	currentMedication: String,

	// Module Progress
	moduleProgress: {
		type: Object,
		default: {},
	},
}, { timestamps: true });

// Index for efficient querying
const Profile = model("Profile", ProfileSchema);

export default Profile;
