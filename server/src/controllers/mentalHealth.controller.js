import MentalHealthReport from "../models/MentalHealthReport.js";
import Profile from "../models/Profile.js";
import sendEmail from "../utils/emailService.js";
import { generateReportEmailContent } from "../utils/reportEmailTemplate.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// CONSTANTS
const USER_POPULATE = "firstName lastName email";

// UTILITIES
const normalizeTemperature = temp =>
	!temp ? temp
	: temp > 50 ? Math.round((((temp - 32) * 5) / 9) * 10) / 10
	: temp;

const calculateOverallRisk = (dass21, gad7, phq9) => {
	const { depression, anxiety, stress } = dass21;
	const severities = [
		depression.severity,
		anxiety.severity,
		stress.severity,
		gad7.severity,
		phq9.severity,
	];

	const severe = severities.filter(severity => severity === "severe").length;
	const moderate = severities.filter(
		severity => severity === "moderate",
	).length;

	if (severe >= 2) return "severe";
	if (severe >= 1 || moderate >= 3) return "high";
	if (moderate >= 1) return "moderate";
	return "low";
};

const generateRecommendations = (
	dass21,
	gad7,
	phq9,
	vitals,
	lifestyle = {},
) => {
	const { depression, anxiety, stress } = dass21;
	const rec = [];
	const add = (category, title, description, priority) =>
		rec.push({ category, title, description, priority });

	const severeCheck = [
		depression.severity,
		anxiety.severity,
		stress.severity,
		gad7.severity,
		phq9.severity,
	];

	if (severeCheck.includes("severe"))
		rec.push({
			category: "Emergency",
			title: "Professional Support",
			description:
				"Your assessment indicates severe symptoms. Seek professional mental health support.",
			priority: "high",
		});

	if (depression.severity !== "normal")
		add(
			"Mental Health",
			"Depression Management",
			"Practice mindfulness, exercise regularly, and maintain social connections.",
			depression.severity === "severe" ? "high" : "medium",
		);

	if (anxiety.severity !== "normal" || gad7.severity !== "minimal")
		add(
			"Mental Health",
			"Anxiety Relief",
			"Use breathing exercises and reduce caffeine intake.",
			anxiety.severity === "severe" || gad7.severity === "severe" ?
				"high"
			:	"medium",
		);

	if (vitals.sleepDuration < 7 || vitals.sleepDuration > 9)
		add(
			"Physical Health",
			"Sleep Optimization",
			"Aim for 7-9 hours of sleep with a consistent routine.",
			"medium",
		);

	if (!["often", "regular"].includes(lifestyle.exerciseFrequency))
		add(
			"Physical Health",
			"Physical Activity",
			"30 minutes of moderate exercise 3–4 times weekly.",
			"medium",
		);

	if (vitals.systolic > 140 || vitals.diastolic > 90)
		add(
			"Physical Health",
			"Blood Pressure Management",
			"Reduce sodium and consult a healthcare provider.",
			"high",
		);

	if (lifestyle.smokingStatus && lifestyle.smokingStatus !== "never")
		add(
			"Lifestyle",
			"Smoking Cessation",
			"Join a cessation program for long-term benefits.",
			"high",
		);

	if (lifestyle.screenTime > 8)
		add(
			"Lifestyle",
			"Digital Wellness",
			"Reduce screen exposure and take breaks.",
			"low",
		);

	return rec;
};

//   HELPERS
// const findUserReport = (id, userId) =>
// 	MentalHealthReport.findOne({ _id: id, user: userId })
// 		.populate({
// 			path: "user",
// 			// select: "_id",
// 			populate: {
// 				path: "profile",
// 				select: USER_POPULATE,
// 			},
// 		})
// 		.lean()
// 		.exec();

const findUserReport = (id, userId) =>
	MentalHealthReport.findOne({ _id: id, user: userId })
		.populate({
			path: "user",
			populate: {
				path: "profile",
				model: "Profile",
				localField: "_id",
				foreignField: "user",
				justOne: true,
				select: USER_POPULATE,
			},
		})
		.select("-_id")
		.lean()
		.exec();

// CONTROLLERS
// Analyze Mental Health
export const analyzeMentalHealth = asyncHandler(async (req, res) => {
	const { vitals, lifestyle, dass21, gad7, phq9 } = req.body;

	const processedVitals = {
		...vitals,
		temperature: normalizeTemperature(vitals?.temperature),
	};

	const overallRisk = calculateOverallRisk(dass21, gad7, phq9);

	const created = await MentalHealthReport.create({
		user: req.user.id,
		vitals: processedVitals,
		lifestyle: lifestyle || {},
		dass21,
		gad7,
		phq9,
		overallRisk,
		recommendations: generateRecommendations(
			dass21,
			gad7,
			phq9,
			processedVitals,
			lifestyle,
		),
	});

	const report = await MentalHealthReport.findById(created._id)
		.populate({
			path: "user",
			populate: {
				path: "profile",
				select: USER_POPULATE,
			},
		})
		.lean();

	res.status(201).json(
		new ApiResponse(
			201,
			report,
			"Mental health analysis completed successfully",
		),
	);
});

// Get Reports
export const getMentalHealthReports = asyncHandler(async (req, res) => {
	const page = Math.max(req.query.page || 1, 1);
	const limit = Math.min(req.query.limit || 10, 100);
	const skip = (page - 1) * limit;

	const [reports, total] = await Promise.all([
		MentalHealthReport.find({ user: req.user.id })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.populate({
				path: "user",
				select: "_id",
				populate: {
					path: "profile",
					select: USER_POPULATE,
				},
			}),
		MentalHealthReport.countDocuments({ user: req.user.id }),
	]);

	res.status(200).json(
		new ApiResponse(200, {
			reports,
			pagination: {
				total,
				page,
				pages: Math.ceil(total / limit),
				limit,
			},
		}),
	);
});

// Get Single Report
export const getMentalHealthReport = asyncHandler(async (req, res) => {
	const report = await findUserReport(req.params.id, req.user.id);
	if (!report) throw new ApiError(404, "Report not found");

	res.status(200).json(
		new ApiResponse(200, report, "Report retrieved successfully"),
	);
});

// Email Report
export const emailMentalHealthReport = asyncHandler(
	async ({ body: { reportId }, user: { id } }, res) => {
		const report = await findUserReport(reportId, id);

		if (!report) throw new ApiError(404, "Report not found");

		const result = await sendEmail({
			to: report.user.email,
			subject: "Your MindSpace Mental Health Report",
			html: generateReportEmailContent(report),
		});

		if (!result.success) throw new ApiError(500, "Email delivery failed");

		res.status(200).json(
			new ApiResponse(200, null, "Report emailed successfully"),
		);
	},
);

// Save Module Progress
export const saveModuleProgress = asyncHandler(async (req, res) => {
	const { module, data } = req.body;

	const profile = await Profile.findOneAndUpdate(
		{ user: req.user.id },
		{ $set: { [`moduleProgress.${module}`]: data } },
		{ new: true, upsert: true, setDefaultsOnInsert: true },
	);

	res.status(200).json(
		new ApiResponse(
			200,
			profile.moduleProgress,
			`${module} progress saved successfully`,
		),
	);
});

// Get Progress
export const getModuleProgress = asyncHandler(async (req, res) => {
	const profile = await Profile.findOne({
		user: req.user.id,
	}).select("moduleProgress");

	res.status(200).json(
		new ApiResponse(
			200,
			profile?.moduleProgress || {},
			"Progress retrieved",
		),
	);
});

// Clear Progress
export const clearModuleProgress = asyncHandler(async (req, res) => {
	await Profile.findOneAndUpdate(
		{ user: req.user.id },
		{ $set: { moduleProgress: {} } },
	);

	res.status(200).json(new ApiResponse(200, null, "Module progress cleared"));
});

// Report PDF Data
// export const downloadReportPDF = asyncHandler(async (req, res) => {
// 	const report = await findUserReport(req.params.id, req.user.id);
// 	if (!report) throw new ApiError(404, "Report not found");

// 	res.status(200).json(
// 		new ApiResponse(
// 			200,
// 			report,
// 			"Report data retrieved for PDF generation",
// 		),
// 	);
// });

export const downloadReportPDF = asyncHandler(async (req, res) => {
	res.status(200).json(
		new ApiResponse(
			200,
			{ message: "PDF generation endpoint - implementation pending" },
			"Report PDF generation is not implemented yet",
		),
	);
	// const report = await findUserReport(req.params.id, req.user.id);
	// if (!report) throw new ApiError(404, "Report not found");

	// const html = await generateReportEmailContent(report);
	// const browser = await puppeteer.launch({
	// 	headless: "new",
	// 	args: ["--no-sandbox", "--disable-setuid-sandbox"],
	// });

	// try {
	// 	const page = await browser.newPage();

	// 	await page.setContent(html, { waitUntil: "networkidle0" });

	// 	const pdfBuffer = await page.pdf({
	// 		format: "A4",
	// 		printBackground: true,
	// 		margin: {
	// 			top: "20px",
	// 			bottom: "20px",
	// 			left: "20px",
	// 			right: "20px",
	// 		},
	// 	});

	// 	const filename = `mindharbor-report-${report._id}.pdf`;

	// 	res.setHeader("Content-Type", "application/pdf");
	// 	res.setHeader(
	// 		"Content-Disposition",
	// 		`attachment; filename="${filename}"`,
	// 	);
	// 	res.setHeader("Content-Length", pdfBuffer.length);

	// 	res.status(200).json(new ApiResponse(200, null, "PDF generated successfully")).end(pdfBuffer);
	// } finally {
	// 	await browser.close();
	// }
});
