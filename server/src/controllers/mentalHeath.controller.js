import { ApiError } from "../utils/apiError";
import { body } from "express-validator";

export const assessmentValidators = [

    // ─── Vitals ───────────────────────────────────────────
    body('vitals')
        .notEmpty().withMessage('Missing required assessment data')
        .isObject().withMessage('Vitals must be an object'),

    body('vitals.systolic')    
        .notEmpty().withMessage('Missing required vital signs data')
        .isInt({ min: 50, max: 250 }).withMessage('Systolic must be between 50 and 250')
        .toInt(),

    body('vitals.diastolic')    
        .notEmpty().withMessage('Missing required vital signs data')
        .isInt({ min: 30, max: 150 }).withMessage('Diastolic must be between 30 and 150')
        .toInt(),

    body('vitals.heartRate')    
        .notEmpty().withMessage('Missing required vital signs data')
        .isInt({ min: 30, max: 250 }).withMessage('Heart rate must be between 30 and 250')
        .toInt(),

    body('vitals.sleepDuration')    
        .notEmpty().withMessage('Missing required vital signs data')
        .isFloat({ min: 0, max: 24 }).withMessage('Sleep duration must be between 0 and 24 hours')
        .toFloat(),

    body('vitals.temperature')    
        .optional()
        .isFloat().withMessage('Temperature must be a number')
        .toFloat()
        .custom((value) => {
            // Convert Fahrenheit to Celsius if needed
            let temp = value;
            if (temp > 50) {
                temp = Math.round((((temp - 32) * 5) / 9) * 10) / 10;
            }    
            if (temp < 35 || temp > 42) {
                throw new Error('Temperature value is out of valid range (35–42°C)');
            }    
            return true;
        }),    

    // ─── DASS-21 ──────────────────────────────────────────    
    body('dass21')
        .notEmpty().withMessage('Missing required assessment data')
        .isObject().withMessage('DASS-21 must be an object'),

    body('dass21.depression')    
        .notEmpty().withMessage('Invalid DASS-21 assessment data')
        .isInt({ min: 0, max: 42 }).withMessage('DASS-21 depression score must be between 0 and 42')
        .toInt(),

    body('dass21.anxiety')    
        .notEmpty().withMessage('Invalid DASS-21 assessment data')
        .isInt({ min: 0, max: 42 }).withMessage('DASS-21 anxiety score must be between 0 and 42')
        .toInt(),

    body('dass21.stress')    
        .notEmpty().withMessage('Invalid DASS-21 assessment data')
        .isInt({ min: 0, max: 42 }).withMessage('DASS-21 stress score must be between 0 and 42')
        .toInt(),

    // ─── GAD-7 ────────────────────────────────────────────    
    body('gad7')
        .notEmpty().withMessage('Missing required assessment data')
        .isObject().withMessage('GAD-7 must be an object'),

    body('gad7.score')    
        .notEmpty().withMessage('Invalid GAD-7 assessment data')
        .isInt({ min: 0, max: 21 }).withMessage('GAD-7 score must be between 0 and 21')
        .toInt(),

    body('gad7.severity')    
        .notEmpty().withMessage('Invalid GAD-7 assessment data')
        .isString().withMessage('GAD-7 severity must be a string')
        .isIn(['minimal', 'mild', 'moderate', 'severe']).withMessage('Invalid GAD-7 severity value'),

    // ─── PHQ-9 ────────────────────────────────────────────    
    body('phq9')
        .notEmpty().withMessage('Missing required assessment data')
        .isObject().withMessage('PHQ-9 must be an object'),

    body('phq9.score')    
        .notEmpty().withMessage('Invalid PHQ-9 assessment data')
        .isInt({ min: 0, max: 27 }).withMessage('PHQ-9 score must be between 0 and 27')
        .toInt(),

    body('phq9.severity')    
        .notEmpty().withMessage('Invalid PHQ-9 assessment data')
        .isString().withMessage('PHQ-9 severity must be a string')
        .isIn(['none', 'minimal', 'mild', 'moderate', 'moderately severe', 'severe'])
        .withMessage('Invalid PHQ-9 severity value'),

    ];            

const analyzeMentalHealth = async (req, res) => {
	try {
		const { vitals, lifestyle, dass21, gad7, phq9 } = req.body;

		// Validate required data
		if (!vitals || !dass21 || !gad7 || !phq9) return res.status(400).json(new ApiError(400, "Missing required assessment data"));

		// Validate vitals data
		if (
			!vitals.systolic ||
			!vitals.diastolic ||
			!vitals.heartRate ||
			!vitals.sleepDuration
		) return res.status(400).json(new ApiError(400, "Missing required vital signs data"));
		

		// Process and validate temperature (convert Fahrenheit to Celsius if needed)
		let processedVitals = { ...vitals };
		if (processedVitals.temperature) {
			// If temperature seems to be in Fahrenheit (> 50), convert to Celsius
			if (processedVitals.temperature > 50) {
				processedVitals.temperature =
					((processedVitals.temperature - 32) * 5) / 9;
				processedVitals.temperature =
					Math.round(processedVitals.temperature * 10) / 10; // Round to 1 decimal
			}

			// Validate temperature range (now in Celsius)
			if (
				processedVitals.temperature < 35 ||
				processedVitals.temperature > 42
			) {
				return res.status(400).json({
					success: false,
					message: "Temperature value is out of valid range",
				});
			}
		}

		// Validate DASS-21 scores
		if (!dass21.depression || !dass21.anxiety || !dass21.stress) {
			return res.status(400).json({
				success: false,
				message: "Invalid DASS-21 assessment data",
			});
		}

		// Validate GAD-7 scores
		if (typeof gad7.score !== "number" || !gad7.severity) {
			return res.status(400).json({
				success: false,
				message: "Invalid GAD-7 assessment data",
			});
		}

		// Validate PHQ-9 scores
		if (typeof phq9.score !== "number" || !phq9.severity) {
			return res.status(400).json({
				success: false,
				message: "Invalid PHQ-9 assessment data",
			});
		}

		// Calculate overall risk level
		const overallRisk = calculateOverallRisk(dass21, gad7, phq9);

		// Generate personalized recommendations
		const recommendations = generateRecommendations(
			dass21,
			gad7,
			phq9,
			processedVitals,
			lifestyle,
		);

		// Create mental health report
		const reportData = {
			user: req.user.id,
			vitals: processedVitals,
			lifestyle: lifestyle || {},
			dass21,
			gad7,
			phq9,
			overallRisk,
			recommendations,
		};

		console.log(
			"Creating report with data:",
			JSON.stringify(reportData, null, 2),
		);

		const report = await MentalHealthReport.create(reportData);

		// Populate user data for response
		await report.populate("user", "firstName lastName email");

		res.status(201).json({
			success: true,
			message: "Mental health analysis completed successfully",
			data: report,
		});
	} catch (error) {
		console.error("Error analyzing mental health:", error);

		// Handle validation errors specifically
		if (error.name === "ValidationError") {
			const validationErrors = Object.values(error.errors).map(
				err => err.message,
			);
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: validationErrors,
			});
		}

		res.status(500).json({
			success: false,
			message: "Server error during analysis",
			error: error.message,
		});
	}
};
