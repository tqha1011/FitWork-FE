import { FileText, Sparkles } from "lucide-react";
import { Avatar, Button } from "./ui";
import type { DemoApplication, DemoSession } from "../types/demo";
import type { ApplicationStatus } from "../types/job";

export default function DemoApplicationCard({
  application,
  title,
  applicant,
  busy,
  ai,
  onPreview,
  onResult,
  onAI,
  onDecision,
}: {
  application: DemoApplication;
  title: string;
  applicant: boolean;
  busy: boolean;
  ai: DemoSession["ai"];
  onPreview: () => void;
  onResult: (id: string, source: "SAMPLE" | "LIVE") => void;
  onAI: () => void;
  onDecision: (status: ApplicationStatus) => void;
}) {
  const running = application.evaluations.some(
    (item) =>
      item.source === "LIVE" &&
      (item.status === "PENDING" || item.status === "PROCESSING"),
  );
  const failed = application.evaluations.some(
    (item) => item.source === "LIVE" && item.status === "FAILED",
  );
  const sampleId = application.sampleEvaluationPublicId;
  return (
    <article className="demo-application panel">
      <div className="demo-application-heading">
        <div className="identity">
          <Avatar name={application.applicantName} />
          <div>
            <h3>{application.applicantName}</h3>
            <p className="muted">{title}</p>
          </div>
        </div>
        <span
          className={`badge badge-${application.status === "ACCEPTED" || application.status === "COMPLETED" ? "success" : application.status === "REJECTED" ? "error" : "neutral"}`}
        >
          {application.status}
        </span>
      </div>
      <div className="demo-evaluation-list">
        {application.evaluations.map((evaluation) => (
          <div key={evaluation.publicId} className="demo-evaluation-row">
            <div>
              <strong>
                {evaluation.source === "SAMPLE"
                  ? "Sample result"
                  : "Live AI result"}
              </strong>
              <span className="muted">
                {evaluation.status === "COMPLETED"
                  ? `${evaluation.overallScore ?? "—"}/100 fit`
                  : evaluation.status === "FAILED"
                    ? "Failed · Samples remain available"
                    : `${evaluation.status}${sampleId ? " · You can open the sample" : " · Waiting for live AI"}`}
              </span>
            </div>
            <Button
              variant="secondary"
              disabled={evaluation.status !== "COMPLETED"}
              onClick={() => onResult(evaluation.publicId, evaluation.source)}
            >
              Open {evaluation.source === "SAMPLE" ? "sample" : "AI result"}
            </Button>
          </div>
        ))}
      </div>
      <div className="demo-application-actions">
        <Button variant="ghost" disabled={busy} onClick={onPreview}>
          <FileText size={16} aria-hidden="true" />
          Preview CV
        </Button>
        {sampleId && (
          <Button variant="ghost" onClick={() => onResult(sampleId, "SAMPLE")}>
            Reopen sample
          </Button>
        )}
        {applicant ? (
          <Button
            disabled={busy || !ai.available || ai.remaining <= 0 || running}
            onClick={onAI}
          >
            <Sparkles size={16} aria-hidden="true" />
            {failed ? "Retry AI" : "Run live AI"}
          </Button>
        ) : (
          <>
            {application.status === "PENDING" && (
              <>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => onDecision("ACCEPTED")}
                >
                  Accept
                </Button>
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => onDecision("REJECTED")}
                >
                  Reject
                </Button>
              </>
            )}
            {application.status === "ACCEPTED" && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => onDecision("COMPLETED")}
              >
                Complete
              </Button>
            )}
          </>
        )}
      </div>
    </article>
  );
}
