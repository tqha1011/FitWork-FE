export type Role = "guest" | "freelancer" | "client";
export type JobStatus = "Draft" | "Open" | "Reviewing" | "Filled" | "Closed" | "Cancelled";
export type ApplicationStatus = "Submitted" | "Reviewing" | "Shortlisted" | "Accepted" | "Rejected" | "Withdrawn";
export type PreviewState = "populated" | "loading" | "empty" | "filtered-empty" | "error" | "unauthorized" | "forbidden" | "not-found";
export type AiState = "ready" | "calculating" | "unavailable" | "stale";
export interface User { id: string; name: string; email: string; role: Exclude<Role, "guest"> }
export interface PortfolioItem { id: string; title: string; description: string; url: string; kind: "design" | "development" | "writing" }
export interface Experience { id: string; title: string; company: string; years: string; description: string }
export interface FreelancerProfile { id: string; name: string; title: string; bio: string; location: string; rate: number; available: boolean; skills: string[]; experience: Experience[]; portfolio: PortfolioItem[] }
export interface ClientProfile { id: string; name: string; contactName: string; overview: string; industry: string; location: string; verified: boolean; website: string }
export interface AiMatch { label: "Strong" | "Potential" | "Limited"; percentage: number; matching: string[]; missing: string[]; explanation: string }
export interface Job { id: string; clientId: string; title: string; category: string; description: string; deliverables: string[]; skills: string[]; experience: string; arrangement: string; budgetType: "Fixed price" | "Hourly"; budgetMin: number; budgetMax: number; duration: string; postedAt: string; deadline: string; status: JobStatus; match: AiMatch }
export interface Application { id: string; jobId: string; freelancerId: string; status: ApplicationStatus; coverLetter: string; rate: number; duration: string; portfolioIds: string[]; attachmentName?: string; submittedAt: string; match: AiMatch }
export interface Notification { id: string; title: string; description: string; date: string; read: boolean; role: Exclude<Role, "guest">; href: string }
export interface AccountSettings { email: boolean; applicationUpdates: boolean; jobRecommendations: boolean; profilePublic: boolean }
