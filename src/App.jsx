import { useEffect, useMemo, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const examples = [
  "Latest treatment for lung cancer",
  "Clinical trials for diabetes",
  "Top researchers in Alzheimer's disease",
  "Recent studies on heart disease",
];

const initialForm = {
  patientName: "",
  disease: "",
  location: "",
  message: "",
};

const SectionCard = ({ title, children, meta }) => (
  <section className="panel">
    <div className="panel-header">
      <div>
        <p className="eyebrow">{meta}</p>
        <h3>{title}</h3>
      </div>
    </div>
    {children}
  </section>
);

function App() {
  const [form, setForm] = useState(initialForm);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeResponse, setActiveResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => form.message.trim().length >= 3, [form.message]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      conversationId: conversationId || undefined,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to generate response");
      }

      const data = result.data;
      console.log(data);
      
      setConversationId(data.conversationId);
      setActiveResponse(data);
      setMessages((current) => [
        ...current,
        {
          role: "user",
          content: form.message,
        },
        {
          role: "assistant",
          content: data.answer.conditionOverview,
          data,
        },
      ]);
      setForm((current) => ({
        ...current,
        message: "",
      }));
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <header className="hero">
        <p className="hero-kicker">Curalink Prototype</p>
        <h1>AI-powered medical research companion for source-backed exploration.</h1>
        <p className="hero-copy">
          Structured intake, deep retrieval from OpenAlex, PubMed, and ClinicalTrials.gov,
          conversation memory, and open-source LLM reasoning through Ollama.
        </p>
      </header>

      <main className="layout">
        <section className="composer panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Intake</p>
              <h2>Ask with patient context</h2>
            </div>
            <span className="status-chip">{conversationId ? "Follow-up mode" : "New conversation"}</span>
          </div>

          <form className="intake-form" onSubmit={submit}>
            <label>
              <span>Patient name</span>
              <input
                value={form.patientName}
                onChange={(event) => updateField("patientName", event.target.value)}
                placeholder="John Smith"
              />
            </label>
            <label>
              <span>Disease of interest</span>
              <input
                value={form.disease}
                onChange={(event) => updateField("disease", event.target.value)}
                placeholder="Parkinson's disease"
              />
            </label>
            <label>
              <span>Location</span>
              <input
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                placeholder="Toronto, Canada"
              />
            </label>
            <label className="message-box">
              <span>Question</span>
              <textarea
                rows="6"
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="What are the latest treatment options and active trials?"
              />
            </label>
            <div className="example-row">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="ghost-chip"
                  onClick={() => updateField("message", example)}
                >
                  {example}
                </button>
              ))}
            </div>
            <button className="primary-button" type="submit" disabled={!canSubmit || loading}>
              {loading ? "Synthesizing evidence..." : "Run research assistant"}
            </button>
            {error ? <p className="error-text">{error}</p> : null}
          </form>
        </section>

        <section className="conversation-column">
          <SectionCard title="Conversation" meta="Context-aware chat">
            <div className="message-list">
              {messages.length === 0 ? (
                <div className="empty-state">
                  Start with a disease, treatment question, or trial search. Follow-ups will reuse the active context.
                </div>
              ) : (
                messages.map((message, index) => (
                  <article key={`${message.role}-${index}`} className={`message-bubble ${message.role}`}>
                    <p className="message-role">{message.role === "user" ? "User" : "Assistant"}</p>
                    <p>{message.content}</p>
                  </article>
                ))
              )}
            </div>
          </SectionCard>

          {activeResponse ? (
            <>
              <SectionCard title="Research Insights" meta="Publication synthesis">
                <div className="insight-list">
                  {activeResponse.answer.researchInsights.map((insight) => (
                    <article key={insight.title} className="insight-card">
                      <h4>{insight.title}</h4>
                      <p>{insight.insight}</p>
                    </article>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Publications" meta="Top ranked sources">
                <div className="resource-list">
                  {activeResponse.publications.map((publication) => (
                    <article key={publication.id} className="resource-card">
                      <div className="resource-head">
                        <h4>{publication.title}</h4>
                        <span>{publication.source}</span>
                      </div>
                      <p className="resource-meta">
                        {(publication.authors || []).join(", ") || "Authors not listed"} |{" "}
                        {publication.year || "Year unavailable"}
                      </p>
                      <p>{publication.supportingSnippet || publication.abstract || "No abstract available."}</p>
                      <a href={publication.url} target="_blank" rel="noreferrer">
                        Open source
                      </a>
                    </article>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Clinical Trials" meta="Filtered and ranked">
                <div className="resource-list">
                  {activeResponse.trials.map((trial) => (
                    <article key={trial.id} className="resource-card">
                      <div className="resource-head">
                        <h4>{trial.title}</h4>
                        <span>{trial.recruitingStatus}</span>
                      </div>
                      <p className="resource-meta">{trial.location || "Location unavailable"}</p>
                      <p>{trial.supportingSnippet || trial.eligibilityCriteria}</p>
                      <p className="resource-meta">{trial.contactInformation}</p>
                      <a href={trial.url} target="_blank" rel="noreferrer">
                        Open trial record
                      </a>
                    </article>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Safety Notes" meta="Companion behavior">
                <ul className="safety-list">
                  {activeResponse.answer.safetyNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                {activeResponse.answer.warning ? (
                  <p className="warning-text">LLM fallback active: {activeResponse.answer.warning}</p>
                ) : null}
              </SectionCard>
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default App;
