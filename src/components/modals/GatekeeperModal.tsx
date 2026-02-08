import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getPriorityLevel, PriorityFactors, PriorityLevel } from "../../utils/priorityEngine";
import { useTasks } from "../../context/TasksContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  getQuestionsForRole,
  pickRandomQuestion,
  shuffleQuestions,
  UserRole,
  ValueQuestion,
  QuestionValue
} from "../../utils/questionPools.ts";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import "./GatekeeperModal.css";

type GatekeeperPayload = {
  projectId: string;
  projectName: string;
  status: string;
  title: string;
  description: string;
  workstreams: string[];
  targetTeams?: string[];
  factors: PriorityFactors;
  totalScore: number;
  level: PriorityLevel;
  metadata: {
    questions?: string[];
    source?: string;
    category?: string;
    priority?: string;
    questionValueSum?: number;
    questionValues?: {
      id: string;
      value: number;
      checked: boolean;
    }[];
  };
};

const DEFAULT_FACTORS: PriorityFactors = {
  blocking: 0,
  urgency: 0,
  impact: 0,
  omissionCost: 0,
  alignment: 0,
  mentalLoad: 0,
  quickWin: 0
};

export const GatekeeperModal = () => {
  const { addTask } = useTasks();
  const { role, user } = useCurrentUser();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { projects } = useSelector((state: { projects: { projects: any[] } }) => state.projects);
  const { workstreams: orgWorkstreams = [], currentOrgId } = useSelector(
    (state: {
      organizations?: { workstreams?: any[]; currentOrgId: string | null };
    }) => state.organizations || { workstreams: [], currentOrgId: null }
  );
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWorkstreams, setSelectedWorkstreams] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<ValueQuestion[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const workstreams = useMemo(() => {
    if (!currentOrgId) return [];
    return orgWorkstreams.filter(
      (stream) => stream.orgId === currentOrgId && stream.enabled
    );
  }, [currentOrgId, orgWorkstreams]);
  const availableProjects = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    const scopedProjects = currentOrgId
      ? projects.filter((project) => !project.orgId || project.orgId === currentOrgId)
      : [];
    if (role === "pm" && user?.id) {
      return scopedProjects.filter(
        (project) => project.pmId === user.id && project.status !== "cancelled"
      );
    }
    return scopedProjects.filter((project) => project.status !== "cancelled");
  }, [currentOrgId, projects, role, user]);
  const maxScore = useMemo(
    () => selectedQuestions.reduce((sum, question) => sum + question.value, 0),
    [selectedQuestions]
  );
  const rawScore = useMemo(
    () =>
      selectedQuestions.reduce(
        (sum, question) => sum + (checkedIds.has(question.id) ? question.value : 0),
        0
      ),
    [checkedIds, selectedQuestions]
  );
  const normalizedScore = useMemo(() => {
    if (!maxScore) return 0;
    return Math.round((rawScore / maxScore) * 14);
  }, [rawScore, maxScore]);
  const priorityLevel = useMemo(() => getPriorityLevel(normalizedScore), [normalizedScore]);

  useEffect(() => {
    const handleOpen = () => {
      setSelectedQuestions([]);
      setCheckedIds(new Set());
      setIsOpen(true);
    };

    window.addEventListener("athenea:gatekeeper:open", handleOpen as EventListener);
    return () => {
      window.removeEventListener("athenea:gatekeeper:open", handleOpen as EventListener);
    };
  }, []);

  const resetState = () => {
    setStep(1);
    setSelectedProjectId("");
    setTitle("");
    setDescription("");
    setSelectedWorkstreams([]);
    setSelectedQuestions([]);
    setCheckedIds(new Set());
    setIsSaving(false);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    resetState();
  };

  const goNext = () => {
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const goBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const selectedProject = availableProjects.find((project) => project.id === selectedProjectId);

  useEffect(() => {
    if (!isOpen || step !== 4) return;
    const rolePools = getQuestionsForRole(role as UserRole, selectedWorkstreams);
    const questionValues: QuestionValue[] = [1, 2, 3, 4, 5, 6, 7];
    const picks = questionValues.map((value) => pickRandomQuestion(rolePools[value]));
    setSelectedQuestions(shuffleQuestions(picks));
    setCheckedIds(new Set());
  }, [isOpen, role, selectedWorkstreams, step]);

  useEffect(() => {
    if (workstreams.length === 0) {
      setSelectedWorkstreams([]);
      return;
    }
    setSelectedWorkstreams((prev) =>
      prev.filter((streamId) => workstreams.some((stream) => stream.id === streamId))
    );
  }, [workstreams]);

  const toggleWorkstream = (id: string) => {
    setSelectedWorkstreams((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (!selectedProject || selectedProject.status === "cancelled") {
        setSaveError(t("Cancelled projects cannot receive new tasks."));
        return;
      }

      const payload: GatekeeperPayload = {
        projectId: selectedProjectId,
        projectName: selectedProject?.name || "",
        status: "Active",
        title: title.trim(),
        description: description.trim(),
        workstreams: selectedWorkstreams,
          targetTeams: selectedWorkstreams,
        factors: DEFAULT_FACTORS,
        totalScore: normalizedScore,
        level: priorityLevel,
        metadata: {
          questions: selectedQuestions
            .filter((question) => checkedIds.has(question.id))
            .map((question) =>
              language === "es" ? question.localized.es : question.localized.en
            ),
          questionValueSum: rawScore,
          questionValues: selectedQuestions.map((question) => ({
            id: question.id,
            value: question.value,
            checked: checkedIds.has(question.id)
          }))
        }
      };

      addTask({
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...payload
      });
      setSaveSuccess(true);
      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (error) {
      setSaveError("Unable to save task. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isStepOneValid = selectedProjectId.length > 0 && Boolean(selectedProject);
  const isStepTwoValid = selectedWorkstreams.length > 0 && workstreams.length > 0;
  const isStepThreeValid = title.trim().length > 0;
  const isStepFourValid = checkedIds.size > 0;

  if (!isOpen) return null;

  return (
    <div className="gatekeeper-overlay" role="dialog" aria-modal="true">
      <div className="gatekeeper-modal">
        <header className="gatekeeper-header">
          <div>
            <h2>{t("Gatekeeper Intake")}</h2>
            <p>{t("Step")} {step} {t("of")} 4</p>
          </div>
          <button className="gatekeeper-close" onClick={closeModal} aria-label={t("Close")}> 
            {t("Close")}
          </button>
        </header>

        {step === 1 && (
          <section className="gatekeeper-step">
            {availableProjects.length === 0 ? (
              <div className="gatekeeper-empty">
                <p>{t("No active projects available. Create a project before logging tasks.")}</p>
                <button
                  type="button"
                  className="gatekeeper-secondary"
                  onClick={() => {
                    closeModal();
                    navigate("/projects");
                  }}
                >
                  {t("Create Project")}
                </button>
              </div>
            ) : (
              <>
                <p className="gatekeeper-hint">{t("Associate this task with a project.")}</p>
                <div className="gatekeeper-projects">
                  {availableProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      className={
                        project.id === selectedProjectId
                          ? "gatekeeper-project is-active"
                          : "gatekeeper-project"
                      }
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <span className="gatekeeper-project-name">{project.name}</span>
                      <span className="gatekeeper-project-meta">
                        {project.clientName}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="gatekeeper-step">
            <p className="gatekeeper-hint">{t("Select at least one area.")}</p>
            {workstreams.length === 0 ? (
              <div className="gatekeeper-empty">
                <p>{t("No workstreams are enabled yet.")}</p>
                <button
                  type="button"
                  className="gatekeeper-secondary"
                  onClick={() => {
                    closeModal();
                    navigate("/workstreams");
                  }}
                >
                  {t("Manage Workstreams")}
                </button>
              </div>
            ) : (
              <div className="gatekeeper-tags">
                {workstreams.map((stream) => (
                  <button
                    key={stream.id}
                    type="button"
                    className={
                      selectedWorkstreams.includes(stream.id)
                        ? "gatekeeper-tag is-active"
                        : "gatekeeper-tag"
                    }
                    onClick={() => toggleWorkstream(stream.id)}
                  >
                    {stream.label}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="gatekeeper-step">
            <label className="gatekeeper-field">
              <span>{t("Task Title")}</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("Enter a concise task title")}
              />
            </label>
            <label className="gatekeeper-field">
              <span>{t("Description")}</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("Add context and constraints")}
                rows={4}
              />
            </label>
          </section>
        )}

        {step === 4 && (
          <section className="gatekeeper-step">
            <p className="gatekeeper-hint">{t("Select the signals that apply.")}</p>
            <div className="gatekeeper-checks">
              {selectedQuestions.map((question) => (
                <label key={question.id} className="gatekeeper-check">
                  <input
                    type="checkbox"
                    checked={checkedIds.has(question.id)}
                    onChange={() => toggleCheck(question.id)}
                  />
                  <span className="gatekeeper-check-text">
                    {language === "es" ? question.localized.es : question.localized.en}
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        <footer className="gatekeeper-footer">
          <button
            type="button"
            className="gatekeeper-secondary"
            onClick={goBack}
            disabled={step === 1}
          >
            {t("Back")}
          </button>
          {saveError && <span className="gatekeeper-status error">{saveError}</span>}
          {saveSuccess && (
            <span className="gatekeeper-status success">
              {t("Task analyzed and prioritized by ATHENEA core.")}
            </span>
          )}
          {step < 4 && (
            <button
              type="button"
              className="gatekeeper-primary"
              onClick={goNext}
              disabled={
                (step === 1 && !isStepOneValid) ||
                (step === 2 && !isStepTwoValid) ||
                (step === 3 && !isStepThreeValid)
              }
            >
              {t("Continue")}
            </button>
          )}
          {step === 4 && (
            <button
              type="button"
              className="gatekeeper-primary"
              onClick={handleSave}
              disabled={isSaving || !isStepOneValid || !isStepFourValid}
            >
              {isSaving ? t("Saving...") : t("Save")}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
