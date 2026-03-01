import { useState } from "react";
import Button from "../components/common/Button";
import Avatar from "../components/common/Avatar";
import Badge from "../components/common/Badge";
import ProgressBar from "../components/common/ProgressBar";
import {
	Mail,
	Phone,
	MapPin,
	GraduationCap,
	Edit3,
	Shield,
} from "lucide-react";

const Profile = () => {
	const [editing, setEditing] = useState(false);

	return (
		<div>
			{/* Hero header with profile */}
			<section className="gradient-hero px-5 lg:px-8 pt-10 pb-14 lg:pt-14 lg:pb-20">
				<div className="max-w-5xl">
					<div className="flex flex-col sm:flex-row items-start gap-6">
						<Avatar name="Vatsal Sharma" size="xl" />
						<div className="flex-1">
							<p className="section-label text-emerald-400 mb-2">
								Your profile
							</p>
							<h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
								Vatsal Sharma
							</h1>
							<p className="text-base text-text-secondary mt-1">
								Computer Science, 3rd Year
							</p>
							<div className="flex flex-wrap items-center gap-2 mt-3">
								<Badge color="lavender">Active Member</Badge>
								<Badge color="mint">7-Day Streak 🔥</Badge>
							</div>
						</div>
						<Button
							variant="secondary"
							size="sm"
							icon={Edit3}
							className="shrink-0"
							onClick={() => setEditing(!editing)}
						>
							Edit Profile
						</Button>
					</div>
				</div>
			</section>

			{/* Body — asymmetric layout */}
			<div className="content-contained space-y-14 py-10">
				<section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
					{/* Main content — wide */}
					<div className="lg:col-span-7 space-y-12">
						{/* Personal info — open, no card */}
						<div>
							<p className="section-label text-text-muted mb-1">
								Details
							</p>
							<h3 className="text-lg font-semibold text-text-primary mb-6">
								Personal Information
							</h3>
							<div className="space-y-4">
								{[
									{
										icon: Mail,
										label: "Email",
										value: "vatsal.sharma@university.edu",
									},
									{
										icon: Phone,
										label: "Phone",
										value: "+91 98765 43210",
									},
									{
										icon: MapPin,
										label: "University",
										value: "Indian Institute of Technology, Delhi",
									},
									{
										icon: GraduationCap,
										label: "Course",
										value: "B.Tech Computer Science & Engineering",
									},
								].map(item => (
									<div
										key={item.label}
										className="flex items-center gap-4 py-2"
									>
										<item.icon
											size={16}
											className="text-emerald-400 shrink-0"
											strokeWidth={1.8}
										/>
										<div>
											<p className="text-xs text-text-muted uppercase tracking-wider">
												{item.label}
											</p>
											<p className="text-sm text-text-primary mt-0.5">
												{item.value}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="section-rule" />

						{/* About */}
						<div>
							<p className="section-label text-text-muted mb-1">
								Bio
							</p>
							<h3 className="text-lg font-semibold text-text-primary mb-4">
								About Me
							</h3>
							<p className="text-sm text-text-secondary leading-relaxed max-w-xl">
								A 3rd year CS student passionate about
								technology and well-being. I believe in taking
								care of mental health alongside academics. Mind
								Harbor has been helping me maintain a healthy
								balance between studies and self-care.
							</p>
						</div>
					</div>

					{/* Sidebar — narrow */}
					<div className="lg:col-span-5 space-y-12">
						{/* Wellness Summary */}
						<div>
							<p className="section-label text-text-muted mb-1">
								Stats
							</p>
							<h3 className="text-lg font-semibold text-text-primary mb-6">
								Wellness Summary
							</h3>
							<div className="space-y-4">
								<ProgressBar
									value={82}
									label="Overall Wellness"
									color="lavender"
								/>
								<ProgressBar
									value={90}
									label="Consistency"
									color="mint"
								/>
								<ProgressBar
									value={65}
									label="Engagement"
									color="sky"
								/>
							</div>
						</div>

						<div className="section-rule" />

						{/* Achievements */}
						<div>
							<p className="section-label text-text-muted mb-1">
								Milestones
							</p>
							<h3 className="text-lg font-semibold text-text-primary mb-6">
								Achievements
							</h3>
							<div className="space-y-3">
								{[
									{
										icon: "🔥",
										label: "7-Day Streak",
										desc: "Logged mood for 7 days straight",
									},
									{
										icon: "💬",
										label: "First Chat",
										desc: "Completed first AI chat session",
									},
									{
										icon: "📚",
										label: "Reader",
										desc: "Read 5 resources",
									},
									{
										icon: "🧘",
										label: "Mindful",
										desc: "Completed 3 breathing exercises",
									},
								].map(a => (
									<div
										key={a.label}
										className="flex items-center gap-3"
									>
										<span className="text-lg">
											{a.icon}
										</span>
										<div>
											<p className="text-sm font-medium text-text-primary">
												{a.label}
											</p>
											<p className="text-xs text-text-muted">
												{a.desc}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Privacy note */}
						<div className="surface-tint rounded-2xl px-5 py-4">
							<div className="flex items-center gap-2 mb-1.5">
								<Shield
									size={14}
									className="text-emerald-400"
									strokeWidth={1.8}
								/>
								<h3 className="text-sm font-medium text-text-primary">
									Privacy Assured
								</h3>
							</div>
							<p className="text-xs text-text-muted leading-relaxed">
								Your data is encrypted and your sessions are
								completely confidential.
							</p>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
};

export default Profile;
