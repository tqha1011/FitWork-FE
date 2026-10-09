import { money, dateLabel } from "../shared/formatters";
import { Bookmark, ArrowUpRight, MapPin, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMarketplace } from "../contexts/marketplaceContext";
import type { Job } from "../types/marketplace";
import {
  AiMatchSummary,
  Avatar,
  Badge,
  Button,
  SkillChip,
  Verified,
} from "./ui";
export default function JobCard({ job }: { job: Job }) {
  const {
    role,
    clientId,
    clients,
    savedIds,
    toggleSave,
    applications,
    freelancers,
    freelancerId,
  } = useMarketplace();
  const client = clients.find((c) => c.id === job.clientId);
  const saved = savedIds.includes(job.id);
  const profile = freelancers.find((f) => f.id === freelancerId);
  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="identity">
          <Avatar name={client?.name ?? "Client"} />
          <div>
            <Link to={`/clients/${job.clientId}`} className="identity-name">
              {client?.name}
            </Link>
            <Verified verified={client?.verified ?? false} />
            <span className="job-posted">Posted {dateLabel(job.postedAt)}</span>
          </div>
        </div>
        {role === "freelancer" ? (
          <Button
            variant="ghost"
            className={`icon-button save-button ${saved ? "saved" : ""}`}
            aria-label={`${saved ? "Unsave" : "Save"} ${job.title}`}
            aria-pressed={saved}
            onClick={() => toggleSave(job.id)}
          >
            <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
          </Button>
        ) : (
          <Badge status={job.status} />
        )}
      </div>
      <Link className="job-title-link" to={`/jobs/${job.id}`}>
        <h2>{job.title}</h2>
        <ArrowUpRight size={20} />
      </Link>
      <p className="job-excerpt">{job.description}</p>
      <div className="chips">
        {job.skills.slice(0, 5).map((skill) => (
          <SkillChip key={skill}>{skill}</SkillChip>
        ))}
        {job.skills.length > 5 && (
          <SkillChip>+{job.skills.length - 5}</SkillChip>
        )}
      </div>
      <div className="job-meta">
        <span>
          <MapPin size={14} />
          {job.arrangement}
        </span>
        <span>
          <Clock3 size={14} />
          {job.duration}
        </span>
        <span>{job.experience}</span>
      </div>
      <div className="job-card-footer">
        <div>
          <strong>
            {money(job.budgetMin)}–{money(job.budgetMax)}
          </strong>
          <span>
            {job.budgetType}
            {job.budgetType === "Hourly" ? " / hr" : ""}
          </span>
        </div>
        {role === "freelancer" && profile && profile.skills.length > 0 ? (
          <AiMatchSummary match={job.match} compact />
        ) : (
          <span className="deadline">
            Apply by {dateLabel(job.deadline).replace(", 2026", "")}
          </span>
        )}
      </div>
      {role === "client" && clientId === job.clientId && (
        <Link
          className="owner-applicants text-link"
          to={`/client/jobs/${job.id}/applicants`}
        >
          {applications.filter((a) => a.jobId === job.id).length} applications{" "}
          <ArrowUpRight size={14} />
        </Link>
      )}
    </article>
  );
}
