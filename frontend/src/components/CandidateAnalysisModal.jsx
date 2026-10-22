
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  LoaderCircle,
} from "lucide-react";
import "./style/CandidateAnalysisModal.css";

export default function CandidateAnalysisModal({
  application,
  analysisResult,
  analyzing,
  error,
  onClose,
  onAnalyze,
}) {
  if (!application) return null;

  const hasFreshResult =
    analysisResult?.application_id === application.id;

  const analysis = hasFreshResult
    ? analysisResult.ai_analysis
    : application.ai_analysis;

  const score = hasFreshResult
    ? analysisResult.ai_score
    : application.ai_score;

  const comparison = hasFreshResult
    ? analysisResult.comparison
    : application.comparison;

  return (
    <div
      className="candidate-analysis-overlay"
      onClick={onClose}
    >
      <section
        className="candidate-analysis-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-analysis-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="candidate-analysis-header">
          <div>
            <span className="candidate-analysis-eyebrow">
              <Sparkles size={15} />
              AI-powered assessment
            </span>

            <h2 id="candidate-analysis-title">
              Candidate AI Analysis
            </h2>

            <p>
              {application.candidates?.first_name}{" "}
              {application.candidates?.last_name}
            </p>
          </div>

          <button
            type="button"
            className="candidate-analysis-close"
            onClick={onClose}
            aria-label="Close AI analysis"
          >
            <X size={20} />
          </button>
        </header>

        <div className="candidate-analysis-content">
          {analyzing ? (
            <div className="candidate-analysis-loading">
              <LoaderCircle size={32} className="analysis-spinner" />
              <h3>Analyzing candidate...</h3>
              <p>
                Comparing the candidate's qualifications with the job
                requirements. This may take a moment.
              </p>
            </div>
          ) : error ? (
            <div className="candidate-analysis-error">
              <AlertCircle size={22} />
              <p>{error}</p>
              <button type="button" onClick={onAnalyze}>
                Try again
              </button>
            </div>
          ) : analysis ? (
            <>
              <div className="candidate-analysis-score">
                <div>
                  <span>Overall match</span>
                  <strong>
                    {score != null ? `${score}%` : "N/A"}
                  </strong>
                </div>

                <div className="candidate-analysis-score-track">
                  <div
                    className="candidate-analysis-score-fill"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, Number(score) || 0)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <section className="candidate-analysis-section">
                <h3>Summary</h3>
                <p>
                  {analysis.summary ||
                    "No summary is available for this analysis."}
                </p>
              </section>

              <div className="candidate-analysis-columns">
                <section className="candidate-analysis-section">
                  <h3>
                    <CheckCircle2 size={18} />
                    Strengths
                  </h3>

                  {analysis.strengths?.length ? (
                    <ul className="candidate-analysis-list strengths-list">
                      {analysis.strengths.map((item, index) => (
                        <li key={index}>
                          {typeof item === "string"
                            ? item
                            : item.description ||
                              item.title ||
                              JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No strengths were returned.</p>
                  )}
                </section>

                <section className="candidate-analysis-section">
                  <h3>
                    <AlertCircle size={18} />
                    Gaps
                  </h3>

                  {analysis.gaps?.length ? (
                    <ul className="candidate-analysis-list gaps-list">
                      {analysis.gaps.map((item, index) => (
                        <li key={index}>
                          {typeof item === "string"
                            ? item
                            : item.description ||
                              item.title ||
                              JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No gaps were returned.</p>
                  )}
                </section>
              </div>

              {analysis.recommendations?.length > 0 && (
                <section className="candidate-analysis-section">
                  <h3>
                    <Lightbulb size={18} />
                    Recommendations
                  </h3>

                  <ul className="candidate-analysis-list">
                    {analysis.recommendations.map((item, index) => (
                      <li key={index}>
                        {typeof item === "string"
                          ? item
                          : item.description ||
                            item.title ||
                            JSON.stringify(item)}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <details className="candidate-analysis-details">
                <summary>View detailed comparison</summary>

                {comparison ? (
                  <div className="comparison-categories">
                    {Object.entries(comparison).map(([category, data]) => {
                        const result = data?.result || {};
                        const normalizedCategory = category.replaceAll("_", " ");

                        let isMatched = null;

                        if (category === "skills") {
                        const missing = result.missing_skills || [];
                        isMatched = missing.length === 0;
                        } else if (category === "experience") {
                        isMatched = result.years?.matched ?? null;
                        } else if (category === "education") {
                        isMatched = result.matched ?? null;
                        } else if (category === "certifications") {
                        isMatched = result.matched ?? null;
                        } else if (category === "soft_skills") {
                        isMatched =
                            result.matched ??
                            ((result.missing || []).length === 0 &&
                            (result.missing || []).length >= 0);
                        }

                        const matchedSkills = result.matches || [];
                        const relatedSkills = result.related_skills || result.related || [];
                        const missingSkills =
                        result.missing_skills || result.missing || [];

                        return (
                        <section
                            className="comparison-category"
                            key={category}
                        >
                            <div className="comparison-category-header">
                            <h4>
                                {normalizedCategory.replace(
                                /\b\w/g,
                                (letter) => letter.toUpperCase()
                                )}
                            </h4>

                            <span
                                className={`comparison-status ${
                                isMatched === true
                                    ? "comparison-status-matched"
                                    : isMatched === false
                                    ? "comparison-status-missing"
                                    : "comparison-status-neutral"
                                }`}
                            >
                                {isMatched === true
                                ? "Requirements met"
                                : isMatched === false
                                    ? "Gaps found"
                                    : data.required
                                    ? "Review"
                                    : "Not required"}
                            </span>
                            </div>

                            {!data.required && (
                            <p className="comparison-note">
                                This category is not required for this job.
                            </p>
                            )}

                            {category === "skills" && (
                            <>
                                {matchedSkills.length > 0 && (
                                <div className="comparison-list-group">
                                    <strong>Matched skills</strong>
                                    <ul>
                                    {matchedSkills.map((item, index) => (
                                        <li key={index}>
                                        {item.job_skill || item.resume_skill}
                                        {item.type === "exact" && (
                                            <span className="comparison-match-type">
                                            Exact match
                                            </span>
                                        )}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                )}

                                {relatedSkills.length > 0 && (
                                <div className="comparison-list-group">
                                    <strong>Related skills</strong>
                                    <ul>
                                    {relatedSkills.map((item, index) => (
                                        <li key={index}>
                                        {typeof item === "string"
                                            ? item
                                            : item.job_skill ||
                                            item.resume_skill ||
                                            item.skill ||
                                            JSON.stringify(item)}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                )}

                                {missingSkills.length > 0 && (
                                <div className="comparison-list-group">
                                    <strong>Missing skills</strong>
                                    <ul>
                                    {missingSkills.map((item, index) => (
                                        <li key={index}>
                                        {typeof item === "string"
                                            ? item
                                            : item.job_skill || item.skill || JSON.stringify(item)}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                )}

                                {matchedSkills.length === 0 &&
                                relatedSkills.length === 0 &&
                                missingSkills.length === 0 && (
                                    <p className="comparison-note">
                                    No individual skill results are available.
                                    </p>
                                )}
                            </>
                            )}

                            {category === "experience" && (
                            <>
                                {result.years && (
                                <p className="comparison-detail">
                                    Candidate experience:{" "}
                                    <strong>{result.years.candidate} year(s)</strong>
                                    <br />
                                    Required experience:{" "}
                                    <strong>{result.years.required} year(s)</strong>
                                </p>
                                )}

                                {result.types && (
                                <div className="comparison-list-group">
                                    <strong>Experience relevance</strong>

                                    {result.types.matches?.length > 0 && (
                                    <p>
                                        Matching experience:{" "}
                                        {result.types.matches.join(", ")}
                                    </p>
                                    )}

                                    {result.types.related?.length > 0 && (
                                    <p>
                                        Related experience:{" "}
                                        {result.types.related.join(", ")}
                                    </p>
                                    )}

                                    {result.types.missing?.length > 0 && (
                                    <p>
                                        Missing experience:{" "}
                                        {result.types.missing.join(", ")}
                                    </p>
                                    )}
                                </div>
                                )}
                            </>
                            )}

                            {category === "education" && (
                            <>
                                {result.level && (
                                <p className="comparison-detail">
                                    Education level:{" "}
                                    <strong>
                                    {Array.isArray(result.level.candidate)
                                        ? result.level.candidate.join(", ")
                                        : result.level.candidate || "Not specified"}
                                    </strong>
                                    {" — "}
                                    {result.level.matched
                                    ? "Meets requirement"
                                    : "Does not meet requirement"}
                                </p>
                                )}

                                {result.field && (
                                <p className="comparison-detail">
                                    Field of study:{" "}
                                    <strong>
                                    {result.field.candidate_field ||
                                        "Not specified"}
                                    </strong>
                                    {" — "}
                                    {result.field.matched
                                    ? "Relevant"
                                    : "Not confirmed as relevant"}
                                </p>
                                )}
                            </>
                            )}

                            {category === "certifications" && (
                            <>
                                {result.matches?.length > 0 && (
                                <div className="comparison-list-group">
                                    <strong>Matched certifications</strong>
                                    <ul>
                                    {result.matches.map((item, index) => (
                                        <li key={index}>
                                        {typeof item === "string"
                                            ? item
                                            : item.name || item.certification || JSON.stringify(item)}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                )}

                                {result.missing?.length > 0 && (
                                <div className="comparison-list-group">
                                    <strong>Missing certifications</strong>
                                    <ul>
                                    {result.missing.map((item, index) => (
                                        <li key={index}>
                                        {typeof item === "string"
                                            ? item
                                            : item.name || item.certification || JSON.stringify(item)}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                )}

                                {result.matches?.length === 0 &&
                                result.missing?.length === 0 && (
                                    <p className="comparison-note">
                                    No certification matches or gaps were returned.
                                    </p>
                                )}
                            </>
                            )}

                            {category === "soft_skills" && (
                            <>
                                {result.matches?.length > 0 && (
                                <div className="comparison-list-group">
                                    <strong>Matched soft skills</strong>
                                    <ul>
                                    {result.matches.map((item, index) => (
                                        <li key={index}>
                                        {typeof item === "string"
                                            ? item
                                            : item.job_skill || item.resume_skill || JSON.stringify(item)}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                )}

                                {result.related?.length > 0 && (
                                <div className="comparison-list-group">
                                    <strong>Related soft skills</strong>
                                    <ul>
                                    {result.related.map((item, index) => (
                                        <li key={index}>
                                        {typeof item === "string"
                                            ? item
                                            : item.job_skill || item.resume_skill || JSON.stringify(item)}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                )}

                                {result.missing?.length > 0 && (
                                <div className="comparison-list-group">
                                    <strong>Missing soft skills</strong>
                                    <ul>
                                    {result.missing.map((item, index) => (
                                        <li key={index}>
                                        {typeof item === "string" ? item : JSON.stringify(item)}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                )}
                            </>
                            )}
                        </section>
                        );
                    })}
                    </div>
                ) : (
                    <p className="comparison-note">
                    Detailed comparison is available after running a new analysis.
                    </p>
                )}
              </details>

              <button
                type="button"
                className="candidate-analysis-reanalyze"
                onClick={onAnalyze}
                disabled={analyzing}
              >
                <Sparkles size={16} />
                Run analysis again
              </button>
            </>
          ) : (
            <div className="candidate-analysis-loading">
              <p>No analysis is available yet.</p>
              <button type="button" onClick={onAnalyze}>
                Analyze candidate
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
