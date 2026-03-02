import { body } from "express-validator";

// ─── Severity enums ───────────────────────────────────────────────────────────
const DASS21_SEVERITIES = ["normal", "mild", "moderate", "severe", "extremely severe"];
const GAD7_SEVERITIES   = ["minimal", "mild", "moderate", "severe"];
const PHQ9_SEVERITIES   = ["none", "minimal", "mild", "moderate", "moderately severe", "severe"];

// ─── Reusable score + severity block ─────────────────────────────────────────
const scoreAndSeverity = (prefix, maxScore, severities) => [
    body(`${prefix}.score`)
        .notEmpty().withMessage(`${prefix} score is required`)
        .isInt({ min: 0, max: maxScore }).withMessage(`${prefix} score must be between 0 and ${maxScore}`)
        .toInt(),
    body(`${prefix}.severity`)
        .notEmpty().withMessage(`${prefix} severity is required`)
        .isIn(severities).withMessage(`Invalid ${prefix} severity. Must be one of: ${severities.join(", ")}`),
];

// ─── Assessment validators ────────────────────────────────────────────────────
export const assessmentValidators = [

    // Vitals — object presence
    body('vitals')
        .notEmpty().withMessage('Vitals data is required')
        .isObject().withMessage('Vitals must be an object'),

    body('vitals.systolic')
        .notEmpty().withMessage('Systolic blood pressure is required')
        .isInt({ min: 50, max: 250 }).withMessage('Systolic must be between 50 and 250')
        .toInt(),

    body('vitals.diastolic')
        .notEmpty().withMessage('Diastolic blood pressure is required')
        .isInt({ min: 30, max: 150 }).withMessage('Diastolic must be between 30 and 150')
        .toInt(),

    body('vitals.heartRate')
        .notEmpty().withMessage('Heart rate is required')
        .isInt({ min: 30, max: 250 }).withMessage('Heart rate must be between 30 and 250 BPM')
        .toInt(),

    body('vitals.sleepDuration')
        .notEmpty().withMessage('Sleep duration is required')
        .isFloat({ min: 0, max: 24 }).withMessage('Sleep duration must be between 0 and 24 hours')
        .toFloat(),

    // Temperature: optional, Fahrenheit or Celsius accepted — conversion & range check
    body('vitals.temperature')
        .optional()
        .isFloat().withMessage('Temperature must be a number')
        .toFloat()
        .custom((value) => {
            const celsius = value > 50
                ? Math.round(((value - 32) * 5 / 9) * 10) / 10
                : value;
            if (celsius < 35 || celsius > 42) {
                throw new Error('Temperature is out of valid range (35–42°C / 95–107.6°F)');
            }
            return true;
        }),

    // DASS-21 — top-level object + nested score/severity for each subscale
    body('dass21')
        .notEmpty().withMessage('DASS-21 data is required')
        .isObject().withMessage('DASS-21 must be an object'),

    ...scoreAndSeverity('dass21.depression', 42, DASS21_SEVERITIES),
    ...scoreAndSeverity('dass21.anxiety',    42, DASS21_SEVERITIES),
    ...scoreAndSeverity('dass21.stress',     42, DASS21_SEVERITIES),

    // GAD-7
    body('gad7')
        .notEmpty().withMessage('GAD-7 data is required')
        .isObject().withMessage('GAD-7 must be an object'),

    ...scoreAndSeverity('gad7', 21, GAD7_SEVERITIES),

    // PHQ-9
    body('phq9')
        .notEmpty().withMessage('PHQ-9 data is required')
        .isObject().withMessage('PHQ-9 must be an object'),

    ...scoreAndSeverity('phq9', 27, PHQ9_SEVERITIES),

    // Lifestyle — fully optional
    body('lifestyle')
        .optional()
        .isObject().withMessage('Lifestyle must be an object'),

    body('lifestyle.exerciseFrequency')
        .optional()
        .isIn(['never', 'rarely', 'sometimes', 'often', 'daily'])
        .withMessage('Invalid exercise frequency'),

    body('lifestyle.smokingStatus')
        .optional()
        .isIn(['never', 'former', 'occasional', 'regular'])
        .withMessage('Invalid smoking status'),

    body('lifestyle.alcoholConsumption')
        .optional()
        .isIn(['never', 'rarely', 'moderate', 'heavy'])
        .withMessage('Invalid alcohol consumption value'),

    body('lifestyle.screenTime')
        .optional()
        .isFloat({ min: 0, max: 24 }).withMessage('Screen time must be between 0 and 24 hours')
        .toFloat(),
];

// ─── Email report validator ───────────────────────────────────────────────────
export const emailReportValidators = [
    body('reportId')
        .notEmpty().withMessage('Report ID is required')
        .isMongoId().withMessage('Invalid report ID format'),
];

// ─── Module progress validator ────────────────────────────────────────────────
export const moduleProgressValidators = [
    body('module')
        .notEmpty().withMessage('Module name is required')
        .isString().withMessage('Module must be a string')
        .trim(),
    body('data')
        .exists().withMessage('Module data is required'),
];

// ─── Pagination validator (for GET /reports) ─────────────────────────────────
export const paginationValidators = [
    body('page')   // using query() in actual route — shown here for reference
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),
    body('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt(),
];
