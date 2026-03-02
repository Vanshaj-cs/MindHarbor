import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Helpers ─────────────────────────────────────────────
const getRiskColor = (risk) => ({
    low: "#10b981",
    moderate: "#f59e0b",
    high: "#f97316",
    severe: "#ef4444",
}[risk] ?? "#64748b");

const getVitalStatus = (type, v1, v2) => {
    const map = {
        bp:
            v1 < 120 && v2 < 80
                ? ["normal", "Normal"]
                : v1 < 140 && v2 < 90
                ? ["elevated", "Elevated"]
                : ["high", "High"],

        hr:
            v1 >= 60 && v1 <= 100
                ? ["normal", "Normal"]
                : ["elevated", "Abnormal"],

        sleep:
            v1 >= 7 && v1 <= 9
                ? ["normal", "Optimal"]
                : ["elevated", "Poor"],
    };

    return map[type] ?? ["normal", "Normal"];
};

const formatLifestyleValue = (value) => {
    if (!value) return "Not specified";
    return value.charAt(0).toUpperCase() +
        value.slice(1).replace(/([A-Z])/g, " $1");
};

// ─── MAIN TEMPLATE RENDERER ─────────────────────────────
export const generateReportEmailContent = async (report) => {

    const {
        user,
        vitals,
        lifestyle,
        dass21,
        gad7,
        phq9,
        overallRisk,
        recommendations,
    } = report;

    const isEmergency = ["severe", "high"].includes(overallRisk);

    const date = new Date(report.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const [bpClass, bpText] =
        getVitalStatus("bp", vitals.systolic, vitals.diastolic);

    const [hrClass, hrText] =
        getVitalStatus("hr", vitals.heartRate);

    const [sleepClass, sleepText] =
        getVitalStatus("sleep", vitals.sleepDuration);

    // absolute path prevents EJS path bugs
    const templatePath = path.join(
        __dirname,
        "../views/reportEmail.ejs"
    );

    return await ejs.renderFile(templatePath, {
        report,
        user,
        vitals,
        lifestyle,
        dass21,
        gad7,
        phq9,
        overallRisk,
        recommendations,
        date,
        isEmergency,
        bpClass,
        bpText,
        hrClass,
        hrText,
        sleepClass,
        sleepText,
        getRiskColor,
        formatLifestyleValue,
    });
};