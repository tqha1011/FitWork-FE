import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, PageHeader } from "../components/ui";
import { JobError, JobField, ReferenceChoices } from "../components/JobUi";
import { useJobs } from "../contexts/jobContext";
import { createJob } from "../services/jobService";
import { jobErrorMessage } from "../shared/jobErrorMessage";
import { validateJobForm, type FieldErrors } from "../shared/jobValidation";
import type { JobStatus } from "../types/job";

export default function CreateJobPage() {
  const jobs = useJobs();
  const navigate = useNavigate();
  const [status, setStatus] = useState<JobStatus>("OPEN");
  const [skills, setSkills] = useState<number[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !jobs.references) return;
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "");
    const validated = validateJobForm({
      title: value("title"),
      description: value("description"),
      requirements: value("requirements"),
      location: value("location"),
      budget: value("budget"),
      currency: value("currency"),
      status,
      categoryId: value("categoryId"),
      arrangementId: value("arrangementId"),
      skillsId: skills.map(String),
      dueAt: value("dueAt"),
    });
    setErrors(validated.errors);
    setError(undefined);
    if (!validated.payload) return;
    setPending(true);
    try {
      await createJob(validated.payload);
      jobs.invalidateSearch();
      toast.success(
        status === "OPEN"
          ? "Job published successfully."
          : "Closed job created. It will not appear in search.",
      );
      navigate("/jobs");
    } catch (error) {
      setError(jobErrorMessage(error, true));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="job-form-page">
      <PageHeader
        eyebrow="Client workspace"
        title="Post a Job"
        description="Share the scope, requirements and budget for your next Job."
      />
      {jobs.referenceError ? (
        <JobError message={jobs.referenceError} retry={jobs.retryReferences} />
      ) : !jobs.references ? (
        <p role="status">Loading Job options…</p>
      ) : (
        <form className="panel stack" noValidate onSubmit={submit}>
          <fieldset disabled={pending} className="job-form-fields stack">
            <h2>Overview and scope</h2>
            <JobField label="Job title" name="title" error={errors.title}>
              {(props) => <input {...props} required />}
            </JobField>
            <JobField
              label="Description"
              name="description"
              error={errors.description}
            >
              {(props) => <textarea {...props} required />}
            </JobField>
            <JobField
              label="Requirements"
              name="requirements"
              error={errors.requirements}
            >
              {(props) => <textarea {...props} required />}
            </JobField>
            <div className="form-grid">
              <JobField
                label="Category"
                name="categoryId"
                error={errors.categoryId}
              >
                {(props) => (
                  <select {...props} required defaultValue="">
                    <option value="" disabled>
                      Choose category
                    </option>
                    {jobs.references!.categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </JobField>
              <JobField
                label="Work arrangement"
                name="arrangementId"
                error={errors.arrangementId}
              >
                {(props) => (
                  <select {...props} required defaultValue="">
                    <option value="" disabled>
                      Choose arrangement
                    </option>
                    {jobs.references!.arrangements.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </JobField>
            </div>
            <JobField label="Location" name="location" error={errors.location}>
              {(props) => (
                <input
                  {...props}
                  required
                  placeholder="City, region or remote"
                />
              )}
            </JobField>
            <ReferenceChoices
              label="Required skills (optional)"
              items={jobs.references.skills}
              selected={skills}
              onChange={setSkills}
            />
            <h2>Budget and timeline</h2>
            <div className="form-grid">
              <JobField label="Budget" name="budget" error={errors.budget}>
                {(props) => (
                  <input {...props} type="number" min="0" step="any" required />
                )}
              </JobField>
              <JobField
                label="Currency"
                name="currency"
                error={errors.currency}
              >
                {(props) => (
                  <select {...props} defaultValue="VND">
                    <option>VND</option>
                    <option>USD</option>
                  </select>
                )}
              </JobField>
            </div>
            <JobField
              label="Application deadline"
              name="dueAt"
              error={errors.dueAt}
              hint="Enter a future date and time in your local timezone."
            >
              {(props) => <input {...props} type="datetime-local" required />}
            </JobField>
            <JobField
              label="Job status"
              name="status"
              hint="Closed jobs do not appear in search."
            >
              {(props) => (
                <select
                  {...props}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as JobStatus)
                  }
                >
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              )}
            </JobField>
          </fieldset>
          {error && <JobError message={error} />}
          <div className="actions">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Creating Job…"
                : status === "OPEN"
                  ? "Publish Job"
                  : "Create closed job"}
            </Button>
            {!pending && (
              <Link className="button button-secondary" to="/jobs">
                Cancel
              </Link>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
