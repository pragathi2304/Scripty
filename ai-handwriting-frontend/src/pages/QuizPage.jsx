import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";

const API = "/api";

const LANGUAGES = [
  { name: "All Languages", native: "English + हिंदी + 日本語 + 한국어 + Русский", symbol: "五", code: "ALL" },
  { name: "English", native: "English", symbol: "A", code: "EN" },
  { name: "Hindi", native: "हिंदी", symbol: "अ", code: "HI" },
  { name: "Japanese", native: "日本語", symbol: "あ", code: "JP" },
  { name: "Korean", native: "한국어", symbol: "한", code: "KR" },
  { name: "Russian", native: "Русский", symbol: "Я", code: "RU" },
];

const JAPANESE_K49 = [
  "あ","い","う","え","お",
  "か","き","く","け","こ",
  "さ","し","す","せ","そ",
  "た","ち","つ","て","と",
  "な","に","ぬ","ね","の",
  "は","ひ","ふ","へ","ほ",
  "ま","み","む","め","も",
  "や","ゆ","よ",
  "ら","り","る","れ","ろ",
  "わ","ゐ","ゑ","を","ん","ゝ",
];

function displayCharacter(language, value) {
  if (value === undefined || value === null) return "";

  const raw = String(value).trim();

  if (language === "Japanese" && /^\d+$/.test(raw)) {
    const index = Number(raw);
    return JAPANESE_K49[index] || raw;
  }

  if (language === "English" || language === "Russian") {
    return raw.toUpperCase();
  }

  return raw;
}

/* ============================================================
   BLANK HANDWRITING CANVAS
   The quiz canvas intentionally contains NO target image/character.
   The target is displayed separately in TargetCard.
============================================================ */

const BlankDrawingCanvas = React.forwardRef(function BlankDrawingCanvas(
  { tool, onDrawingChange },
  ref
) {
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);
  const currentStrokeRef = useRef(null);
  const drawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const old = canvas.toDataURL();

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    /* Re-render existing strokes after resize. */
    if (strokesRef.current.length) {
      drawAll();
    } else if (old && old !== "data:,") {
      /* Do not restore the old image: strokes are the source of truth. */
    }
  };

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const source = event.touches?.[0] || event;
    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top,
    };
  };

  const drawStroke = (ctx, stroke) => {
    if (!stroke?.points?.length) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 28;
      ctx.strokeStyle = "#000";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#ffffff";
    }

    const points = stroke.points;

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
    ctx.restore();
  };

  const drawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }
  };

  const notify = () => {
    onDrawingChange?.(
      strokesRef.current.map((stroke) => ({
        tool: stroke.tool,
        points: stroke.points.map((point) => ({
          x: point.x,
          y: point.y,
        })),
      }))
    );
  };

  const startDrawing = (event) => {
    event.preventDefault();

    const point = getPoint(event);
    drawingRef.current = true;

    currentStrokeRef.current = {
      tool,
      points: [point],
    };

    strokesRef.current = [
      ...strokesRef.current,
      currentStrokeRef.current,
    ];

    setIsEmpty(false);

    drawAll();
    notify();
  };

  const continueDrawing = (event) => {
    if (!drawingRef.current) return;

    event.preventDefault();

    const point = getPoint(event);
    const current = currentStrokeRef.current;

    if (!current) return;

    current.points.push(point);

    drawAll();
    notify();
  };

  const stopDrawing = (event) => {
    if (!drawingRef.current) return;

    event?.preventDefault();

    drawingRef.current = false;
    currentStrokeRef.current = null;

    drawAll();
    notify();
  };

  const clear = () => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    drawingRef.current = false;
    setIsEmpty(true);

    const canvas = canvasRef.current;

    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext("2d");

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
    }

    onDrawingChange?.([]);
  };

  const getImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty || !strokesRef.current.length) return null;

    /*
     * Always send the backend a normal white-background image with
     * black handwriting. The visible quiz canvas is dark with white
     * ink, but transparent/dark canvas pixels can be interpreted as
     * empty handwriting by the recognition preprocessing.
     */
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = Math.max(1, Math.round(rect.width * dpr));
    exportCanvas.height = Math.max(1, Math.round(rect.height * dpr));

    const ctx = exportCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* White background required by the handwriting model. */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    /* Replay the recorded strokes as black handwriting. */
    for (const stroke of strokesRef.current) {
      if (!stroke?.points?.length) continue;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 28;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#000000";
      }

      const points = stroke.points;

      if (points.length === 1) {
        ctx.beginPath();
        ctx.arc(
          points[0].x,
          points[0].y,
          ctx.lineWidth / 2,
          0,
          Math.PI * 2
        );
        ctx.fillStyle =
          stroke.tool === "eraser" ? "rgba(0,0,0,1)" : "#000000";
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i += 1) {
          ctx.lineTo(points[i].x, points[i].y);
        }

        ctx.stroke();
      }

      ctx.restore();
    }

    return exportCanvas.toDataURL("image/png");
  };

  React.useImperativeHandle(ref, () => ({
    clear,
    getImage,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resizeCanvas();

    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });

    observer.observe(canvas);

    window.addEventListener("resize", resizeCanvas);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <CanvasShell>
      <CanvasElement
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={continueDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={continueDrawing}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
      />

      {isEmpty && (
        <CanvasPlaceholder>
          Write the character here
        </CanvasPlaceholder>
      )}
    </CanvasShell>
  );
});

export default function QuizPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);

  const [drawingData, setDrawingData] = useState([]);
  const [tool, setTool] = useState("pen");

  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);

  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [quizFinished, setQuizFinished] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const currentQuestion = quiz?.questions?.[questionIndex];

  const resetCanvas = () => {
    setDrawingData([]);
    setResult(null);
    setTool("pen");

    canvasRef.current?.clear();
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("scriptlyUser");
      navigate("/login", { replace: true });
    }
  };

  const loadQuiz = async (languageOverride = selectedLanguage) => {
    if (!languageOverride) {
      setError("Please select a language first.");
      return;
    }

    setLoadingQuiz(true);
    setError("");
    setQuiz(null);
    setQuizFinished(false);
    setFinalResult(null);
    setAnswers([]);
    setQuestionIndex(0);
    resetCanvas();

    try {
      const isAllLanguages =
        languageOverride === "All Languages";

      /*
       * IMPORTANT:
       * For an individual language we send the language explicitly
       * in the POST body and also verify the returned questions.
       * This prevents Hindi/Japanese/Korean/Russian from accidentally
       * displaying English questions if an older backend is running.
       */
      const response = await fetch(`${API}/quiz`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isAllLanguages
            ? {}
            : { language: languageOverride }),
          count: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to generate the quiz."
        );
      }

      let questions = data.quiz?.questions || [];

      /*
       * Strict language check.
       * If a language-specific quiz receives questions belonging to
       * another language, rebuild the quiz directly from /languages.
       */
      if (
        !isAllLanguages &&
        questions.some(
          (question) =>
            question.language !== languageOverride
        )
      ) {
        const languagesResponse = await fetch(
          `${API}/languages`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const languagesData =
          await languagesResponse.json();

        const characters =
          languagesData?.languages?.[languageOverride] || [];

        if (!characters.length) {
          throw new Error(
            `No characters are available for ${languageOverride}.`
          );
        }

        questions = characters
          .slice()
          .sort(() => Math.random() - 0.5)
          .slice(0, 10)
          .map((character, index) => ({
            question_number: index + 1,
            language: languageOverride,
            character,
          }));

        /*
         * If a language has fewer than 10 characters, repeat characters
         * so every quiz still has exactly 10 questions.
         */
        while (questions.length < 10) {
          const character =
            characters[
              questions.length % characters.length
            ];

          questions.push({
            question_number: questions.length + 1,
            language: languageOverride,
            character,
          });
        }
      }

      if (!questions.length) {
        throw new Error(
          `No quiz questions are available for ${languageOverride}.`
        );
      }

      /*
       * For individual language quizzes, force the language field on
       * every question to the selected language.
       */
      if (!isAllLanguages) {
        questions = questions.map(
          (question, index) => ({
            ...question,
            question_number:
              index + 1,
            language: languageOverride,
          })
        );
      }

      setQuiz({
        ...(data.quiz || {}),
        question_count: questions.length,
        questions,
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to connect to the handwriting backend."
      );
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setQuiz(null);
    setResult(null);
    setAnswers([]);
    setQuestionIndex(0);
    setError("");
    resetCanvas();
  };

  const handleDrawingChange = (strokes) => {
    setDrawingData(strokes || []);
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    setDrawingData([]);
    setResult(null);
  };

  const recognizeAnswer = async () => {
    if (!currentQuestion) return;

    if (!drawingData.length) {
      setResult({
        accuracy: 0,
        confidence: 0,
        recognized: "--",
        isCorrect: false,
        feedback:
          "Please draw the target character before submitting.",
      });
      return;
    }

    const image = canvasRef.current?.getImage();

    if (!image) {
      setResult({
        accuracy: 0,
        confidence: 0,
        recognized: "--",
        isCorrect: false,
        feedback:
          "Unable to capture your handwriting.",
      });
      return;
    }

    setRecognizing(true);
    setResult(null);

    try {
      const response = await fetch(`${API}/predict`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: currentQuestion.language,
          character: currentQuestion.character,
          image,
          strokes: drawingData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Handwriting recognition failed."
        );
      }

      let confidence =
        data.confidence ??
        data.probability ??
        0;

      if (
        typeof confidence === "number" &&
        confidence <= 1
      ) {
        confidence *= 100;
      }

      let accuracy =
        data.accuracy ??
        confidence;

      if (
        typeof accuracy === "number" &&
        accuracy <= 1
      ) {
        accuracy *= 100;
      }

      const recognized =
        data.recognized ??
        data.predicted_character ??
        data.prediction ??
        data.character ??
        "--";

      const isCorrect = Boolean(
        data.is_correct ??
          data.correct ??
          data.target_match ??
          false
      );

      const feedback =
        data.feedback ||
        data.message ||
        (
          isCorrect
            ? "Good work. Your handwriting matches the target."
            : "Practice the target character again and focus on its overall shape."
        );

      const resultData = {
        accuracy: Number(accuracy) || 0,
        confidence: Number(confidence) || 0,
        recognized,
        isCorrect,
        feedback,
        strokeAnalysis:
          data.stroke_analysis ||
          data.strokeAnalysis ||
          null,
        mistakeAnalysis:
          data.mistake_analysis ||
          data.mistakeAnalysis ||
          null,
      };

      setResult(resultData);

      setAnswers((previous) => {
        const updated = [...previous];

        updated[questionIndex] = {
          question_number:
            currentQuestion.question_number ||
            questionIndex + 1,
          language: currentQuestion.language,
          character: currentQuestion.character,
          accuracy: resultData.accuracy,
          is_correct: resultData.isCorrect,
          feedback: resultData.feedback,
        };

        return updated;
      });

      try {
        await fetch(`${API}/save-attempt`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: currentQuestion.language,
            character: currentQuestion.character,
            recognized,
            confidence: resultData.confidence,
            accuracy: resultData.accuracy,
            is_correct: resultData.isCorrect,
            strokes: drawingData,
            stroke_analysis:
              resultData.strokeAnalysis,
            mistake_analysis:
              resultData.mistakeAnalysis,
            feedback: resultData.feedback,
          }),
        });
      } catch (saveError) {
        console.warn(
          "Quiz answer recognized but could not be saved:",
          saveError
        );
      }
    } catch (err) {
      setResult({
        accuracy: 0,
        confidence: 0,
        recognized: "--",
        isCorrect: false,
        feedback:
          err?.message ||
          "Unable to connect to the handwriting backend.",
      });
    } finally {
      setRecognizing(false);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/quiz/submit`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: selectedLanguage,
            results: finalAnswers,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit the quiz."
        );
      }

      setFinalResult(data.quiz_result);
      setQuizFinished(true);
      await loadQuizHistory();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to submit the quiz."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!result || !currentQuestion) return;

    if (
      questionIndex <
      quiz.question_count - 1
    ) {
      setQuestionIndex(
        (previous) => previous + 1
      );

      resetCanvas();
      return;
    }

    const finalAnswers = answers.filter(Boolean);

    await submitQuiz(finalAnswers);
  };

  const loadQuizHistory = async () => {
    setLoadingHistory(true);

    try {
      const response = await fetch(
        `${API}/quiz/attempts?limit=10`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setQuizHistory(
          Array.isArray(data.attempts)
            ? data.attempts
            : []
        );
      }
    } catch (historyError) {
      console.warn(
        "Unable to load quiz history:",
        historyError
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStartAgain = () => {
    loadQuiz(selectedLanguage);
  };

  const progressPercent = quiz
    ? ((questionIndex + 1) /
        quiz.question_count) *
      100
    : 0;

  if (quizFinished && finalResult) {
    return (
      <Page>
        <Navbar>
          <LogoLink to="/dashboard">
            <LogoImage
              src="/scriptly-logo.png"
              alt="SCRIPTLY"
            />
          </LogoLink>

          <NavLinks>
            <NavLink to="/dashboard">
              Dashboard
            </NavLink>

            <NavLink to="/practice">
              Practice
            </NavLink>

            <NavLink to="/quiz" $active>
              Quiz
            </NavLink>

            <NavLink to="/performance">
              Practice Performance
            </NavLink>

            <NavLink to="/quiz-performance">
              Quiz Performance
            </NavLink>

            <LogoutButton onClick={logout}>
              Logout
            </LogoutButton>
          </NavLinks>
        </Navbar>

        <Main>
          <ResultPageCard>
            <Eyebrow>
              {selectedLanguage.toUpperCase()} QUIZ COMPLETE
            </Eyebrow>

            <ResultTitle>
              Quiz Complete
            </ResultTitle>

            <ResultSubtitle>
              {selectedLanguage === "All Languages"
                ? "Your mixed-language handwriting quiz result."
                : `Your ${selectedLanguage} handwriting quiz result.`}
            </ResultSubtitle>

            <ScoreCircle>
              <ScoreValue>
                {Math.round(
                  Number(
                    finalResult.score || 0
                  )
                )}%
              </ScoreValue>

              <ScoreLabel>
                SCORE
              </ScoreLabel>
            </ScoreCircle>

            <ResultStats>
              <ResultStat>
                <ResultStatValue>
                  {finalResult.correct_answers ?? 0}
                </ResultStatValue>
                <ResultStatLabel>
                  CORRECT
                </ResultStatLabel>
              </ResultStat>

              <ResultStat>
                <ResultStatValue>
                  {finalResult.incorrect_answers ?? 0}
                </ResultStatValue>
                <ResultStatLabel>
                  INCORRECT
                </ResultStatLabel>
              </ResultStat>

              <ResultStat>
                <ResultStatValue>
                  {Number(
                    finalResult.overall_accuracy || 0
                  ).toFixed(1)}%
                </ResultStatValue>
                <ResultStatLabel>
                  ACCURACY
                </ResultStatLabel>
              </ResultStat>
            </ResultStats>

            <AnswerReview>
              <ReviewTitle>
                Question Review
              </ReviewTitle>

              {(
                finalResult.results ||
                answers
              ).map((item, index) => (
                <ReviewRow
                  key={
                    item.question_number ||
                    index
                  }
                >
                  <ReviewNumber>
                    {item.question_number ||
                      index + 1}
                  </ReviewNumber>

                  <ReviewCharacter>
                    {displayCharacter(
                      item.language ||
                        selectedLanguage,
                      item.character
                    )}
                  </ReviewCharacter>

                  <ReviewLanguage>
                    {item.language ||
                      selectedLanguage}
                  </ReviewLanguage>

                  <ReviewAccuracy>
                    {Number(
                      item.accuracy || 0
                    ).toFixed(1)}%
                  </ReviewAccuracy>

                  <ReviewStatus
                    $correct={
                      item.is_correct
                    }
                  >
                    {item.is_correct
                      ? "Correct"
                      : "Needs Practice"}
                  </ReviewStatus>
                </ReviewRow>
              ))}
            </AnswerReview>

            <div
              style={{
                marginTop: "24px",
                padding: "18px",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    color: "#c4b5fd",
                    fontSize: "11px",
                    letterSpacing: "1.2px",
                    fontWeight: 700,
                  }}
                >
                  SAVED QUIZ ATTEMPTS
                </div>

                <button
                  type="button"
                  onClick={loadQuizHistory}
                  disabled={loadingHistory}
                  style={{
                    border: "1px solid rgba(139,92,246,0.35)",
                    background: "rgba(124,58,237,0.10)",
                    color: "#c4b5fd",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  {loadingHistory
                    ? "Refreshing..."
                    : "Refresh"}
                </button>
              </div>

              {quizHistory.length === 0 ? (
                <div
                  style={{
                    color: "#8f849f",
                    fontSize: "12px",
                  }}
                >
                  No previous quiz attempts found.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  {quizHistory.map((attempt) => (
                    <div
                      key={attempt.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(120px,1fr) 80px 90px 100px",
                        gap: "10px",
                        alignItems: "center",
                        padding: "11px 12px",
                        borderRadius: "10px",
                        background:
                          "rgba(255,255,255,0.025)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#f5f1fa",
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          {attempt.language}
                        </div>
                        <div
                          style={{
                            color: "#8f849f",
                            fontSize: "10px",
                            marginTop: "3px",
                          }}
                        >
                          {attempt.created_at
                            ? new Date(
                                attempt.created_at
                              ).toLocaleString()
                            : "--"}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: "#c4b5fd",
                            fontWeight: 700,
                            fontSize: "14px",
                          }}
                        >
                          {Number(
                            attempt.score || 0
                          ).toFixed(1)}%
                        </div>
                        <div
                          style={{
                            color: "#8f849f",
                            fontSize: "9px",
                          }}
                        >
                          SCORE
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: "#f5f1fa",
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          {attempt.correct_answers ?? 0}/
                          {attempt.total_questions ?? 0}
                        </div>
                        <div
                          style={{
                            color: "#8f849f",
                            fontSize: "9px",
                          }}
                        >
                          CORRECT
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            color: "#f5f1fa",
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          {Number(
                            attempt.overall_accuracy || 0
                          ).toFixed(1)}%
                        </div>
                        <div
                          style={{
                            color: "#8f849f",
                            fontSize: "9px",
                          }}
                        >
                          ACCURACY
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <ErrorBox>
                {error}
              </ErrorBox>
            )}

            <ResultActions>
              <SecondaryButton
                type="button"
                onClick={() =>
                  navigate("/dashboard")
                }
              >
                Dashboard
              </SecondaryButton>

              <PrimaryButton
                type="button"
                onClick={handleStartAgain}
              >
                Try Again
              </PrimaryButton>
            </ResultActions>
          </ResultPageCard>
        </Main>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar>
        <LogoLink to="/dashboard">
          <LogoImage
            src="/scriptly-logo.png"
            alt="SCRIPTLY"
          />
        </LogoLink>

        <NavLinks>
          <NavLink to="/dashboard">
            Dashboard
          </NavLink>

          <NavLink to="/practice">
            Practice
          </NavLink>

          <NavLink to="/quiz" $active>
            Quiz
          </NavLink>

          <NavLink to="/performance">
            Practice Performance
          </NavLink>

          <NavLink to="/quiz-performance">
            Quiz Performance
          </NavLink>

          <LogoutButton onClick={logout}>
            Logout
          </LogoutButton>
        </NavLinks>
      </Navbar>

      <Main>
        <Header>
          <Eyebrow>
            QUIZ / TEST MODE
          </Eyebrow>

          <Title>
            Test your
            <Gradient>
              handwriting skills.
            </Gradient>
          </Title>

          <Subtitle>
            Choose a language for a dedicated quiz,
            or choose All Languages for a mixed
            10-question quiz using English, Hindi,
            Japanese, Korean and Russian. The
            writing canvas is always blank so you
            write the character yourself.
          </Subtitle>
        </Header>

        {!quiz && (
          <LanguageSection>
            <SectionLabel>
              SELECT A LANGUAGE
            </SectionLabel>

            <SectionTitle>
              Choose your quiz
            </SectionTitle>

            <SectionDescription>
              Each language has its own separate
              quiz. Questions will not be mixed
              between languages.
            </SectionDescription>

            <LanguageGrid>
              {LANGUAGES.map((item) => (
                <LanguageCard
                  key={item.name}
                  type="button"
                  $active={
                    selectedLanguage ===
                    item.name
                  }
                  onClick={() =>
                    handleLanguageSelect(
                      item.name
                    )
                  }
                >
                  <LanguageSymbol>
                    {item.symbol}
                  </LanguageSymbol>

                  <LanguageCardInfo>
                    <LanguageName>
                      {item.name}
                    </LanguageName>

                    <LanguageNative>
                      {item.native}
                    </LanguageNative>

                    <LanguageCode>
                      {item.code} · 10 QUESTIONS
                    </LanguageCode>
                  </LanguageCardInfo>

                  <LanguageArrow>
                    →
                  </LanguageArrow>
                </LanguageCard>
              ))}
            </LanguageGrid>

            {selectedLanguage && (
              <SelectedBox>
                <SelectedText>
                  Selected:
                  <strong>
                    {selectedLanguage}
                  </strong>
                </SelectedText>

                <StartButton
                  type="button"
                  onClick={() =>
                    loadQuiz(
                      selectedLanguage
                    )
                  }
                  disabled={loadingQuiz}
                >
                  {loadingQuiz
                    ? "Generating..."
                    : selectedLanguage === "All Languages"
                    ? "Start All Languages Quiz →"
                    : `Start ${selectedLanguage} Quiz →`}
                </StartButton>
              </SelectedBox>
            )}

            {error && (
              <ErrorBox>
                {error}
              </ErrorBox>
            )}
          </LanguageSection>
        )}

        {quiz && currentQuestion && (
          <>
            <QuizTopBar>
              <div>
                <QuestionLabel>
                  QUESTION{" "}
                  {questionIndex + 1} OF{" "}
                  {quiz.question_count}
                </QuestionLabel>

                <QuestionLanguage>
                  {currentQuestion.language} · 10-question quiz
                  {selectedLanguage === "All Languages"
                    ? " · Mixed Languages"
                    : ""}
                </QuestionLanguage>
              </div>

              <ChangeLanguageButton
                type="button"
                onClick={() => {
                  setQuiz(null);
                  setResult(null);
                  setAnswers([]);
                  setQuestionIndex(0);
                  resetCanvas();
                }}
              >
                Change Language
              </ChangeLanguageButton>
            </QuizTopBar>

            <ProgressTrack>
              <ProgressFill
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </ProgressTrack>

            <QuizGrid>
              <TargetCard>
                <SmallLabel>
                  WRITE THIS CHARACTER
                </SmallLabel>

                <TargetCharacter>
                  {displayCharacter(
                    currentQuestion.language,
                    currentQuestion.character
                  )}
                </TargetCharacter>

                <TargetLanguage>
                  {currentQuestion.language}
                </TargetLanguage>

                <TargetHint>
                  Look at the character above and
                  write it on the blank canvas.
                  {selectedLanguage === "All Languages"
                    ? " The next question may use a different language."
                    : ""}
                </TargetHint>
              </TargetCard>

              <CanvasCard>
                <CanvasHeader>
                  <div>
                    <SmallLabel>
                      YOUR HANDWRITING
                    </SmallLabel>

                    <CanvasTitle>
                      Write here
                    </CanvasTitle>
                  </div>

                  <ToolGroup>
                    <ToolButton
                      type="button"
                      $active={
                        tool === "pen"
                      }
                      onClick={() =>
                        setTool("pen")
                      }
                    >
                      Pen
                    </ToolButton>

                    <ToolButton
                      type="button"
                      $active={
                        tool === "eraser"
                      }
                      onClick={() =>
                        setTool("eraser")
                      }
                    >
                      Eraser
                    </ToolButton>
                  </ToolGroup>
                </CanvasHeader>

                <BlankDrawingCanvas
                  ref={canvasRef}
                  tool={tool}
                  onDrawingChange={
                    handleDrawingChange
                  }
                />

                <CanvasActions>
                  <ClearButton
                    type="button"
                    onClick={handleClear}
                    disabled={recognizing}
                  >
                    Clear
                  </ClearButton>

                  <PrimaryButton
                    type="button"
                    onClick={
                      recognizeAnswer
                    }
                    disabled={
                      recognizing ||
                      submitting
                    }
                  >
                    {recognizing
                      ? "Analyzing..."
                      : "Submit Answer"}
                  </PrimaryButton>
                </CanvasActions>
              </CanvasCard>
            </QuizGrid>

            {result && (
              <AnalysisCard>
                <AnalysisHeader>
                  <div>
                    <SmallLabel>
                      AI ANALYSIS
                    </SmallLabel>

                    <AnalysisTitle>
                      {result.isCorrect
                        ? "Character recognized correctly"
                        : "Keep practicing this character"}
                    </AnalysisTitle>
                  </div>

                  <Accuracy>
                    {Number(
                      result.accuracy || 0
                    ).toFixed(1)}
                    %
                  </Accuracy>
                </AnalysisHeader>

                <AnalysisGrid>
                  <AnalysisItem>
                    <AnalysisLabel>
                      TARGET
                    </AnalysisLabel>

                    <AnalysisValue>
                      {displayCharacter(
                        currentQuestion.language,
                        currentQuestion.character
                      )}
                    </AnalysisValue>
                  </AnalysisItem>

                  <AnalysisItem>
                    <AnalysisLabel>
                      RECOGNIZED
                    </AnalysisLabel>

                    <AnalysisValue>
                      {displayCharacter(
                        currentQuestion.language,
                        result.recognized
                      )}
                    </AnalysisValue>
                  </AnalysisItem>

                  <AnalysisItem>
                    <AnalysisLabel>
                      CONFIDENCE
                    </AnalysisLabel>

                    <AnalysisValue>
                      {Number(
                        result.confidence || 0
                      ).toFixed(1)}
                      %
                    </AnalysisValue>
                  </AnalysisItem>
                </AnalysisGrid>

                <FeedbackBox
                  $correct={
                    result.isCorrect
                  }
                >
                  <FeedbackIcon>
                    {result.isCorrect
                      ? "✓"
                      : "!"}
                  </FeedbackIcon>

                  <div>
                    <FeedbackLabel>
                      FEEDBACK
                    </FeedbackLabel>

                    <FeedbackText>
                      {result.feedback}
                    </FeedbackText>
                  </div>
                </FeedbackBox>

                <NextRow>
                  <NextButton
                    type="button"
                    onClick={handleNext}
                    disabled={submitting}
                  >
                    {submitting
                      ? "Submitting..."
                      : questionIndex ===
                        quiz.question_count -
                          1
                      ? "Finish Quiz"
                      : "Next Question →"}
                  </NextButton>
                </NextRow>
              </AnalysisCard>
            )}
          </>
        )}
      </Main>
    </Page>
  );
}

/* ============================================================
   STYLES
============================================================ */

const Page = styled.div`
  min-height: 100vh;

  background:
    radial-gradient(
      circle at 85% 10%,
      rgba(124, 58, 237, 0.18),
      transparent 30%
    ),
    #0b0718;

  color: white;
`;

const Navbar = styled.nav`
  height: 78px;

  padding: 0 6%;

  display: flex;

  align-items: center;

  justify-content: space-between;

  border-bottom: 1px solid
    rgba(255, 255, 255, 0.07);

  background: transparent;

  gap: 30px;

  @media (max-width: 1100px) {
    padding: 18px 5%;

    height: auto;

    flex-direction: column;

    align-items: flex-start;
  }
`;

const LogoLink = styled(Link)`
  display: flex;

  align-items: center;

  flex: 0 0 auto;
`;

const LogoImage = styled.img`
  width: 185px;

  height: auto;

  display: block;
`;

const NavLinks = styled.div`
  display: flex;

  align-items: center;

  gap: 28px;

  margin-left: auto;

  white-space: nowrap;

  @media (max-width: 1100px) {
    width: 100%;

    margin-left: 0;

    overflow-x: auto;
  }

  @media (max-width: 700px) {
    gap: 18px;
  }
`;

const NavLink = styled(Link)`
  color: ${(props) =>
    props.$active
      ? "#b99cff"
      : "#91899f"};

  font-size: 13px;

  font-weight: 400;

  text-decoration: none;

  padding: 0;

  background: transparent;

  border: 0;

  border-radius: 0;

  transition: 0.2s;

  white-space: nowrap;

  &:hover {
    color: white;
  }
`;

const LogoutButton = styled.button`
  color: #91899f;

  font-size: 13px;

  font-weight: 400;

  text-decoration: none;

  padding: 0;

  background: transparent;

  border: 0;

  border-radius: 0;

  cursor: pointer;

  transition: 0.2s;

  white-space: nowrap;

  &:hover {
    color: white;
  }
`;

const Main = styled.main`
  width: min(1180px, 92%);
  margin: 0 auto;
  padding: 54px 0 80px;
`;

const Header = styled.div`
  margin-bottom: 34px;
`;

const HeaderText = styled.div`
  max-width: 780px;
`;

const Eyebrow = styled.div`
  color: #a78bfa;
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 800;
  margin-bottom: 10px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(34px, 5vw, 58px);
  line-height: 1.04;
  letter-spacing: -2px;
`;

const Gradient = styled.span`
  display: block;
  background: linear-gradient(
    90deg,
    #c4b5fd,
    #8b5cf6
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  color: #958ca0;
  font-size: 15px;
  line-height: 1.7;
  max-width: 680px;
  margin: 16px 0 0;
`;

const LanguageSection = styled.section`
  margin-top: 34px;
`;

const SectionLabel = styled.div`
  color: #a78bfa;
  font-size: 10px;
  letter-spacing: 1.8px;
  font-weight: 800;
`;

const SectionTitle = styled.h2`
  margin: 7px 0 0;
  font-size: 28px;
`;

const SectionDescription = styled.p`
  margin: 7px 0 22px;
  color: #81798b;
  font-size: 13px;
`;

const LanguageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const LanguageCard = styled.button`
  width: 100%;
  min-height: 105px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 15px;
  text-align: left;
  border: 1px solid
    ${({ $active }) =>
      $active
        ? "rgba(167,139,250,0.5)"
        : "rgba(139,92,246,0.13)"};
  border-radius: 17px;
  background:
    ${({ $active }) =>
      $active
        ? "rgba(124,58,237,0.13)"
        : "rgba(20,16,27,0.82)"};
  color: #ffffff;
  cursor: pointer;
  transition: 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(167,139,250,0.4);
    background: rgba(35,25,52,0.9);
  }
`;

const LanguageSymbol = styled.div`
  width: 55px;
  height: 55px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: rgba(139,92,246,0.14);
  font-size: 25px;
  font-weight: 800;
`;

const LanguageCardInfo = styled.div`
  min-width: 0;
  flex: 1;
`;

const LanguageName = styled.div`
  font-size: 17px;
  font-weight: 800;
`;

const LanguageNative = styled.div`
  margin-top: 3px;
  color: #a39aaa;
  font-size: 13px;
`;

const LanguageCode = styled.div`
  margin-top: 7px;
  color: #70677b;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
`;

const LanguageArrow = styled.div`
  color: #a78bfa;
  font-size: 22px;
`;

const SelectedBox = styled.div`
  margin-top: 18px;
  padding: 17px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: 14px;
  background: rgba(124,58,237,0.06);

  @media (max-width: 650px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SelectedText = styled.div`
  color: #968ca1;
  font-size: 12px;

  strong {
    margin-left: 7px;
    color: #d9d0e0;
  }
`;

const StartButton = styled.button`
  border: 0;
  border-radius: 10px;
  padding: 12px 20px;
  color: white;
  background: #7c3aed;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: #8b5cf6;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const QuizTopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 18px;

  @media (max-width: 650px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const QuestionLabel = styled.div`
  color: #a78bfa;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
`;

const QuestionLanguage = styled.div`
  margin-top: 5px;
  color: #81798b;
  font-size: 12px;
`;

const ChangeLanguageButton = styled.button`
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 9px;
  padding: 9px 13px;
  color: #aaa0b1;
  background: rgba(255,255,255,0.03);
  font-size: 11px;
  cursor: pointer;

  &:hover {
    color: white;
  }
`;

const ProgressTrack = styled.div`
  height: 5px;
  margin: 14px 0 24px;
  border-radius: 99px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: #8b5cf6;
  transition: width 0.25s ease;
`;

const QuizGrid = styled.div`
  display: grid;
  grid-template-columns: 0.7fr 1.3fr;
  gap: 22px;

  @media (max-width: 850px) {
    grid-template-columns: 1fr;
  }
`;

const TargetCard = styled.section`
  min-height: 390px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  border: 1px solid rgba(139,92,246,0.14);
  background: rgba(20,16,27,0.84);
`;

const SmallLabel = styled.div`
  color: #8f849f;
  font-size: 9px;
  letter-spacing: 1.5px;
  font-weight: 800;
`;

const TargetCharacter = styled.div`
  margin: 25px 0 12px;
  font-size: 130px;
  line-height: 1;
  font-weight: 600;
  color: #f4eff9;
`;

const TargetLanguage = styled.div`
  color: #a78bfa;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
`;

const TargetHint = styled.p`
  max-width: 270px;
  margin: 16px 0 0;
  color: #766d80;
  text-align: center;
  font-size: 11px;
  line-height: 1.6;
`;

const CanvasCard = styled.section`
  padding: 22px;
  border-radius: 18px;
  border: 1px solid rgba(139,92,246,0.14);
  background: rgba(20,16,27,0.84);
`;

const CanvasHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
`;

const CanvasTitle = styled.div`
  margin-top: 5px;
  color: #d9d0e0;
  font-size: 16px;
  font-weight: 750;
`;

const ToolGroup = styled.div`
  display: flex;
  gap: 7px;
`;

const ToolButton = styled.button`
  border: 1px solid
    ${({ $active }) =>
      $active
        ? "rgba(139,92,246,0.5)"
        : "rgba(255,255,255,0.08)"};
  background:
    ${({ $active }) =>
      $active
        ? "rgba(124,58,237,0.18)"
        : "rgba(255,255,255,0.03)"};
  color: #c9c0d2;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 11px;
  cursor: pointer;
`;

const CanvasShell = styled.div`
  position: relative;
  width: 100%;
  height: 420px;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(139,92,246,0.12);
  background:
    linear-gradient(
      rgba(255,255,255,0.025) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(255,255,255,0.025) 1px,
      transparent 1px
    ),
    #0d0a13;
  background-size: 42px 42px;
`;

const CanvasElement = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
  touch-action: none;
`;

const CanvasPlaceholder = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  color: rgba(255,255,255,0.18);
  font-size: 12px;
  letter-spacing: 0.5px;
`;

const CanvasActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
`;

const ClearButton = styled.button`
  border: 1px solid rgba(255,255,255,0.09);
  background: rgba(255,255,255,0.03);
  color: #aaa0b1;
  border-radius: 9px;
  padding: 11px 16px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
  }
`;

const PrimaryButton = styled.button`
  border: 0;
  border-radius: 9px;
  padding: 11px 18px;
  color: white;
  background: #7c3aed;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const AnalysisCard = styled.section`
  margin-top: 22px;
  padding: 24px;
  border-radius: 18px;
  border: 1px solid rgba(139,92,246,0.16);
  background: rgba(20,16,27,0.88);
`;

const AnalysisHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
`;

const AnalysisTitle = styled.h2`
  margin: 7px 0 0;
  font-size: 20px;
`;

const Accuracy = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: #a78bfa;
`;

const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const AnalysisItem = styled.div`
  padding: 13px;
  border-radius: 10px;
  background: rgba(255,255,255,0.025);
`;

const AnalysisLabel = styled.div`
  color: #756b83;
  font-size: 9px;
  letter-spacing: 1px;
`;

const AnalysisValue = styled.div`
  margin-top: 5px;
  color: #d9d0e0;
  font-weight: 700;
`;

const FeedbackBox = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 18px;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid
    ${({ $correct }) =>
      $correct
        ? "rgba(52,211,153,0.18)"
        : "rgba(251,191,36,0.18)"};
  background:
    ${({ $correct }) =>
      $correct
        ? "rgba(52,211,153,0.05)"
        : "rgba(251,191,36,0.05)"};
`;

const FeedbackIcon = styled.div`
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #c4b5fd;
  background: rgba(139,92,246,0.14);
  font-weight: 800;
`;

const FeedbackLabel = styled.div`
  color: #8f849f;
  font-size: 9px;
  letter-spacing: 1px;
  margin-bottom: 5px;
`;

const FeedbackText = styled.div`
  color: #b9afc2;
  font-size: 12px;
  line-height: 1.6;
`;

const NextRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
`;

const NextButton = styled.button`
  border: 0;
  border-radius: 9px;
  padding: 12px 20px;
  color: white;
  background: #7c3aed;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const ErrorBox = styled.div`
  margin: 16px 0;
  padding: 13px 15px;
  border-radius: 10px;
  color: #f0b6b6;
  background: rgba(220,38,38,0.08);
  border: 1px solid rgba(220,38,38,0.18);
  font-size: 12px;
`;

const ResultPageCard = styled.div`
  max-width: 850px;
  margin: 0 auto;
  text-align: center;
  padding: 40px 30px;
  border-radius: 22px;
  border: 1px solid rgba(139,92,246,0.16);
  background: rgba(20,16,27,0.88);
`;

const ResultTitle = styled.h1`
  margin: 0;
  font-size: 38px;
`;

const ResultSubtitle = styled.p`
  color: #837a8d;
  font-size: 13px;
`;

const ScoreCircle = styled.div`
  width: 150px;
  height: 150px;
  margin: 30px auto;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 7px solid rgba(139,92,246,0.28);
  background: rgba(124,58,237,0.08);
`;

const ScoreValue = styled.div`
  font-size: 34px;
  font-weight: 900;
  color: #c4b5fd;
`;

const ScoreLabel = styled.div`
  color: #766d80;
  font-size: 9px;
  letter-spacing: 1.5px;
`;

const ResultStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 30px;
`;

const ResultStat = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: rgba(255,255,255,0.025);
`;

const ResultStatValue = styled.div`
  font-size: 24px;
  font-weight: 900;
  color: #d8cff0;
`;

const ResultStatLabel = styled.div`
  margin-top: 5px;
  color: #766d80;
  font-size: 9px;
  letter-spacing: 1px;
`;

const AnswerReview = styled.div`
  text-align: left;
  margin-top: 15px;
`;

const ReviewTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 16px;
`;

const ReviewRow = styled.div`
  min-height: 55px;
  padding: 9px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.055);

  &:last-child {
    border-bottom: 0;
  }
`;

const ReviewNumber = styled.div`
  width: 24px;
  color: #756b83;
  font-size: 11px;
`;

const ReviewCharacter = styled.div`
  width: 38px;
  font-size: 21px;
  font-weight: 700;
`;

const ReviewLanguage = styled.div`
  flex: 1;
  color: #94899e;
  font-size: 11px;
`;

const ReviewAccuracy = styled.div`
  color: #bca5ff;
  font-size: 11px;
  font-weight: 800;
`;

const ReviewStatus = styled.div`
  width: 95px;
  text-align: right;
  color: ${({ $correct }) =>
    $correct
      ? "#8fe0bd"
      : "#e6c37a"};
  font-size: 10px;
  font-weight: 800;
`;

const ResultActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
`;

const SecondaryButton = styled.button`
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 9px;
  padding: 11px 18px;
  color: #aaa0b1;
  background: rgba(255,255,255,0.03);
  cursor: pointer;
`;

const ResultPageCardPrimaryButton = styled.button`
  border: 0;
  border-radius: 9px;
  padding: 11px 18px;
  color: white;
  background: #7c3aed;
  font-weight: 800;
  cursor: pointer;
`;

