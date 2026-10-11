import type { EvaluationDetail, JobOwnerEvaluation } from "../types/evaluation";
export default function EvaluationResult({
  result,
}: {
  result: EvaluationDetail | JobOwnerEvaluation;
}) {
  const { scoreBreakdown: breakdown, evidence } = result;
  const owner = "decisionSupportOnly" in result ? result : undefined;
  return (
    <section className="evaluation-result stack" aria-label="Evaluation result">
      <div className="evaluation-score-row">
        <div>
          <p className="muted">
            {owner ? "Decision support result" : "Resume evaluation"}
          </p>
          <h3>Overall fit</h3>
        </div>
        <p className="evaluation-score">
          {result.overallScore}
          <span>/100</span>
        </p>
      </div>
      {evidence.explanation && <p>{evidence.explanation}</p>}
      <div className="evaluation-summary">
        <div>
          <h3>Strengths</h3>
          {evidence.strengths?.length ? (
            <ul>
              {evidence.strengths.map((text, index) => (
                <li key={index}>{text}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No strengths reported.</p>
          )}
        </div>
        <div>
          <h3>Gaps to discuss</h3>
          {evidence.gaps?.length ? (
            <ul>
              {evidence.gaps.map((text, index) => (
                <li key={index}>{text}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No gaps reported.</p>
          )}
        </div>
      </div>
      {breakdown.schemaVersion === 1 ? (
        <dl className="evaluation-breakdown">
          {(
            [
              ["skills", "Skills"],
              ["experience", "Experience"],
              ["education", "Education"],
              ["overallFit", "Overall fit"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{breakdown[key]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <>
          <div className="evaluation-table-scroll">
            <table className="evaluation-table">
              <caption>Score contributions</caption>
              <thead>
                <tr>
                  <th scope="col">Criterion</th>
                  <th scope="col">Contribution</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.criteria.map((criterion) => (
                  <tr key={criterion.criterionId}>
                    <th scope="row">
                      {evidence.schemaVersion === 2
                        ? (evidence.criteria.find(
                            (item) =>
                              item.criterionId === criterion.criterionId,
                          )?.criterionText ?? criterion.criterionId)
                        : criterion.criterionId}
                    </th>
                    <td>{criterion.scoreContribution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {evidence.schemaVersion === 2 && (
        <div className="criterion-list">
          {evidence.criteria.map((criterion) => (
            <article className="criterion-result" key={criterion.criterionId}>
              <div className="section-heading">
                <h3>{criterion.criterionText}</h3>
                <span
                  className={`badge badge-${criterion.verdict === "MATCHED" ? "success" : criterion.verdict === "MISSING" ? "error" : "warning"}`}
                >
                  {criterion.verdict === "MATCHED"
                    ? "Matched"
                    : criterion.verdict === "PARTIAL"
                      ? "Partial match"
                      : "Missing"}
                </span>
              </div>
              <p>{criterion.explanation}</p>
              <p className="muted">
                Contribution: {criterion.scoreContribution} points
              </p>
              {criterion.evidence.length ? (
                criterion.evidence.map((item, index) => (
                  <figure className="evaluation-citation" key={index}>
                    <blockquote>{item.snippet}</blockquote>
                    <figcaption className="field-hint">
                      Section: {item.section}
                    </figcaption>
                  </figure>
                ))
              ) : (
                <p className="muted">
                  No resume citations reported for this criterion.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
      {owner && (
        <>
          <details className="redacted-resume">
            <summary>Resume text used for evaluation</summary>
            {owner.resumeRedaction.redactedResumeText !== null ? (
              <pre>{owner.resumeRedaction.redactedResumeText}</pre>
            ) : (
              <p>Resume text is unavailable for this evaluation.</p>
            )}
          </details>
        </>
      )}
    </section>
  );
}
