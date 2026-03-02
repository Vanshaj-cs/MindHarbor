import { Router } from "express";
import { query } from "express-validator";
import { protect } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import {
	assessmentValidators,
	emailReportValidators,
	moduleProgressValidators,
} from "../validators/mentalHealth.validator.js";
import {
	analyzeMentalHealth,
	getMentalHealthReports,
	getMentalHealthReport,
	emailMentalHealthReport,
	downloadReportPDF,
	saveModuleProgress,
	getModuleProgress,
	clearModuleProgress,
} from "../controllers/mentalHealth.controller.js";

const router = Router();

// All routes are private
// router.use(protect);

// Analysis
router.post("/analyze", ...assessmentValidators, validate, analyzeMentalHealth);

// Reports
router.get(
	"/reports",
	...[
		query("page").optional().isInt({ min: 1 }).toInt(),
		query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
	],
	validate,
	getMentalHealthReports,
);
router.get("/reports/:id", getMentalHealthReport);
router.get("/reports/:id/pdf", downloadReportPDF);

// Email
router.post(
	"/email-report",
	...emailReportValidators,
	validate,
	emailMentalHealthReport,
);

// Progress
router.post(
	"/progress",
	...moduleProgressValidators,
	validate,
	saveModuleProgress,
);
router.get("/progress", getModuleProgress);
router.delete("/progress/clear", clearModuleProgress);

export default router;