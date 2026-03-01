import { useState } from "react";
import Button from "../components/common/Button";
import {
	Bell,
	Moon,
	Globe,
	Shield,
	Eye,
	Volume2,
	Palette,
	Lock,
	Trash2,
	LogOut,
	Save,
} from "lucide-react";

const Toggle = ({ enabled, onChange }) => (
	<button
		onClick={() => onChange(!enabled)}
		className={`
      relative w-11 h-6 rounded-full transition-colors duration-200
      ${enabled ? "bg-forest-700" : "bg-surface-hover"}
    `}
	>
		<span
			className={`
        absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
        transition-transform duration-200
        ${enabled ? "translate-x-5" : "translate-x-0"}
      `}
		/>
	</button>
);

const SettingRow = ({ icon: Icon, label, description, children }) => (
	<div className="flex items-center justify-between py-3.5 gap-4">
		<div className="flex items-center gap-3">
			<Icon size={18} className="text-emerald-400 shrink-0" />
			<div>
				<p className="text-sm font-medium text-text-primary">{label}</p>
				{description && (
					<p className="text-xs text-text-muted mt-0.5">
						{description}
					</p>
				)}
			</div>
		</div>
		{children}
	</div>
);

const Settings = () => {
	const [notifs, setNotifs] = useState(true);
	const [darkMode, setDarkMode] = useState(false);
	const [sounds, setSounds] = useState(true);
	const [moodReminder, setMoodReminder] = useState(true);
	const [language, setLanguage] = useState("English");

	return (
		<div>
			{/* Hero header */}
			<section className="px-5 lg:px-8 pt-10 pb-8 lg:pt-14 lg:pb-10">
				<div className="max-w-5xl">
					<p className="section-label text-emerald-400 mb-2">
						Preferences
					</p>
					<h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
						Settings
					</h1>
					<p className="text-base text-text-secondary mt-2">
						Customize your Mind Harbor experience
					</p>
				</div>
			</section>

			<div className="content-contained space-y-10 pb-10">
				<div className="max-w-2xl space-y-10">
					{/* Notifications */}
					<section>
						<h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
							Notifications
						</h3>
						<div className="divide-y divide-border-soft/50">
							<SettingRow
								icon={Bell}
								label="Push Notifications"
								description="Get notified about mood reminders and sessions"
							>
								<Toggle enabled={notifs} onChange={setNotifs} />
							</SettingRow>
							<SettingRow
								icon={Bell}
								label="Daily Mood Reminder"
								description="Gentle reminder to log your mood"
							>
								<Toggle
									enabled={moodReminder}
									onChange={setMoodReminder}
								/>
							</SettingRow>
						</div>
					</section>

					{/* Appearance */}
					<section>
						<h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
							Appearance
						</h3>
						<div className="divide-y divide-border-soft/50">
							<SettingRow
								icon={Moon}
								label="Dark Mode"
								description="Easier on the eyes at night"
							>
								<Toggle
									enabled={darkMode}
									onChange={setDarkMode}
								/>
							</SettingRow>
							<SettingRow
								icon={Volume2}
								label="Sound Effects"
								description="Subtle sounds for interactions"
							>
								<Toggle enabled={sounds} onChange={setSounds} />
							</SettingRow>
							<SettingRow
								icon={Globe}
								label="Language"
								description="Choose your preferred language"
							>
								<select
									value={language}
									onChange={e => setLanguage(e.target.value)}
									className="
                px-3 py-1.5 rounded-lg
                text-xs text-text-primary bg-surface-card
                focus:outline-none focus:ring-2 focus:ring-forest-600
              "
								>
									<option>English</option>
									<option>Hindi</option>
									<option>Tamil</option>
									<option>Telugu</option>
									<option>Bengali</option>
								</select>
							</SettingRow>
						</div>
					</section>

					{/* Privacy */}
					<section>
						<h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
							Privacy & Security
						</h3>
						<div className="divide-y divide-border-soft/50">
							<SettingRow
								icon={Shield}
								label="Data Encryption"
								description="Your data is encrypted end-to-end"
							>
								<span className="text-xs text-emerald-400 font-medium">
									Active ✓
								</span>
							</SettingRow>
							<SettingRow
								icon={Eye}
								label="Profile Visibility"
								description="Control who sees your profile"
							>
								<select
									className="
                px-3 py-1.5 rounded-lg
                text-xs text-text-primary bg-surface-card
                focus:outline-none focus:ring-2 focus:ring-forest-600
              "
								>
									<option>Only Me</option>
									<option>Counselors</option>
								</select>
							</SettingRow>
							<SettingRow
								icon={Lock}
								label="Change Password"
								description="Update your account password"
							>
								<Button variant="secondary" size="sm">
									Change
								</Button>
							</SettingRow>
						</div>
					</section>

					{/* Danger zone */}
					<section>
						<h3 className="text-xs font-semibold uppercase tracking-wider text-red-400/70 mb-1">
							Danger Zone
						</h3>
						<div className="divide-y divide-border-soft/50">
							<SettingRow
								icon={LogOut}
								label="Sign Out"
								description="Log out of your account"
							>
								<Button variant="secondary" size="sm">
									Sign Out
								</Button>
							</SettingRow>
							<SettingRow
								icon={Trash2}
								label="Delete Account"
								description="Permanently delete your account and data"
							>
								<Button variant="danger" size="sm">
									Delete
								</Button>
							</SettingRow>
						</div>
					</section>

					<Button icon={Save}>Save Settings</Button>
				</div>
			</div>
		</div>
	);
};

export default Settings;
