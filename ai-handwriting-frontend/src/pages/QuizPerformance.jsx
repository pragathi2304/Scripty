import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";

const API = "/api";

const LANGUAGE_ORDER = [
  "English",
  "Hindi",
  "Japanese",
  "Korean",
  "Russian",
  "All Languages",
];

export default function QuizPerformance() {
  const navigate = useNavigate();

  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPerformance = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/quiz/performance`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Unable to load quiz performance."
        );
      }

      setPerformance(data.performance);
    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    loadPerformance();
  }, []);

  const languageStats = useMemo(() => {
    const stats = performance?.language_stats || [];

    return [...stats].sort((a, b) => {
      const ai = LANGUAGE_ORDER.indexOf(a.language);
      const bi = LANGUAGE_ORDER.indexOf(b.language);

      const av = ai === -1 ? 999 : ai;
      const bv = bi === -1 ? 999 : bi;

      return av - bv;
    });
  }, [performance]);

  if (loading) {
    return (
      <Page>
        <LoadingCard>Loading quiz performance...</LoadingCard>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Header>
          <Brand>
            <Logo
              src="/scriptly-logo.png"
              alt="SCRIPTLY"
            />
          </Brand>

          <Nav>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/practice">Practice</NavLink>
            <NavLink to="/quiz">Quiz</NavLink>
            <NavLink to="/performance">Practice Performance</NavLink>
            <NavLink to="/quiz-performance" $active>
              Quiz Performance
            </NavLink>
            <LogoutButton onClick={logout}>Logout</LogoutButton>
          </Nav>
        </Header>

        <Shell>
          <ErrorCard>
            <h2>Quiz Performance</h2>
            <p>{error}</p>
            <ActionButton onClick={loadPerformance}>
              Try Again
            </ActionButton>
          </ErrorCard>
        </Shell>
      </Page>
    );
  }

  const p = performance || {};
  const totalQuizzes = p.total_quizzes || 0;
  const averageScore = Number(
    p.average_score || 0
  );
  const bestScore = Number(
    p.best_score || 0
  );
  const averageAccuracy = Number(
    p.average_accuracy || 0
  );
  const totalQuestions = p.total_questions || 0;
  const totalCorrect = p.total_correct || 0;

  return (
    <Page>
      <Header>
        <Brand>
          <Logo
            src="/scriptly-logo.png"
            alt="SCRIPTLY"
          />
        </Brand>

        <Nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/practice">Practice</NavLink>
          <NavLink to="/quiz">Quiz</NavLink>
          <NavLink to="/performance">Practice Performance</NavLink>
          <NavLink to="/quiz-performance" $active>
            Quiz Performance
          </NavLink>
          <LogoutButton onClick={logout}>Logout</LogoutButton>
        </Nav>
      </Header>

      <Shell>
        <Main>
          <TitleBlock>
            <Eyebrow>QUIZ ANALYTICS</Eyebrow>
            <Title>Quiz Performance</Title>
            <Subtitle>
              Track your quiz scores and progress separately
              from handwriting practice performance.
            </Subtitle>
          </TitleBlock>

          <StatsGrid>
            <StatCard>
              <StatValue>{totalQuizzes}</StatValue>
              <StatLabel>QUIZZES COMPLETED</StatLabel>
            </StatCard>

            <StatCard>
              <StatValue>
                {averageScore.toFixed(1)}%
              </StatValue>
              <StatLabel>AVERAGE SCORE</StatLabel>
            </StatCard>

            <StatCard>
              <StatValue>
                {bestScore.toFixed(1)}%
              </StatValue>
              <StatLabel>BEST SCORE</StatLabel>
            </StatCard>

            <StatCard>
              <StatValue>
                {averageAccuracy.toFixed(1)}%
              </StatValue>
              <StatLabel>AVERAGE ACCURACY</StatLabel>
            </StatCard>
          </StatsGrid>

          <Section>
            <SectionHeader>
              <div>
                <SectionEyebrow>QUIZ PROGRESS</SectionEyebrow>
                <SectionTitle>
                  Overall Quiz Progress
                </SectionTitle>
              </div>

              <RefreshButton onClick={loadPerformance}>
                Refresh
              </RefreshButton>
            </SectionHeader>

            <ProgressCard>
              <ProgressTop>
                <div>
                  <SmallLabel>
                    QUESTIONS ANSWERED
                  </SmallLabel>
                  <BigNumber>
                    {totalCorrect}/{totalQuestions}
                  </BigNumber>
                </div>

                <div>
                  <SmallLabel>
                    QUESTION ACCURACY
                  </SmallLabel>
                  <BigNumber>
                    {Number(
                      p.question_accuracy || 0
                    ).toFixed(1)}%
                  </BigNumber>
                </div>
              </ProgressTop>

              <ProgressTrack>
                <ProgressFill
                  $width={
                    Number(
                      p.question_accuracy || 0
                    )
                  }
                />
              </ProgressTrack>
            </ProgressCard>
          </Section>

          <Section>
            <SectionHeader>
              <div>
                <SectionEyebrow>
                  LANGUAGE-WISE QUIZ PERFORMANCE
                </SectionEyebrow>
                <SectionTitle>
                  Performance by Quiz Language
                </SectionTitle>
              </div>
            </SectionHeader>

            {languageStats.length === 0 ? (
              <EmptyCard>
                No quiz attempts yet.
                <br />
                Start a quiz to build your quiz performance.
              </EmptyCard>
            ) : (
              <LanguageGrid>
                {languageStats.map((item) => (
                  <LanguageCard key={item.language}>
                    <LanguageTop>
                      <LanguageName>
                        {item.language}
                      </LanguageName>

                      <ScorePill>
                        {Number(
                          item.average_score || 0
                        ).toFixed(1)}%
                      </ScorePill>
                    </LanguageTop>

                    <LanguageMeta>
                      {item.quiz_count} quiz
                      {item.quiz_count === 1
                        ? ""
                        : "zes"}{" "}
                      ·{" "}
                      {item.total_questions} questions
                    </LanguageMeta>

                    <MiniRow>
                      <MiniStat>
                        <strong>
                          {Number(
                            item.average_score || 0
                          ).toFixed(1)}%
                        </strong>
                        <span>Avg Score</span>
                      </MiniStat>

                      <MiniStat>
                        <strong>
                          {Number(
                            item.average_accuracy || 0
                          ).toFixed(1)}%
                        </strong>
                        <span>Avg Accuracy</span>
                      </MiniStat>

                      <MiniStat>
                        <strong>
                          {item.correct_answers}
                        </strong>
                        <span>Correct</span>
                      </MiniStat>
                    </MiniRow>

                    <ProgressTrack>
                      <ProgressFill
                        $width={Number(
                          item.average_score || 0
                        )}
                      />
                    </ProgressTrack>
                  </LanguageCard>
                ))}
              </LanguageGrid>
            )}
          </Section>

          <Section>
            <SectionHeader>
              <div>
                <SectionEyebrow>
                  SCORE HISTORY
                </SectionEyebrow>
                <SectionTitle>
                  Recent Quiz Attempts
                </SectionTitle>
              </div>
            </SectionHeader>

            {!p.recent_attempts ||
            p.recent_attempts.length === 0 ? (
              <EmptyCard>
                No saved quiz attempts yet.
              </EmptyCard>
            ) : (
              <HistoryCard>
                <HistoryHeader>
                  <span>LANGUAGE</span>
                  <span>SCORE</span>
                  <span>CORRECT</span>
                  <span>ACCURACY</span>
                  <span>DATE</span>
                </HistoryHeader>

                {p.recent_attempts.map((item) => (
                  <HistoryRow key={item.id}>
                    <strong>{item.language}</strong>

                    <ScoreText>
                      {Number(
                        item.score || 0
                      ).toFixed(1)}%
                    </ScoreText>

                    <span>
                      {item.correct_answers}/
                      {item.total_questions}
                    </span>

                    <span>
                      {Number(
                        item.overall_accuracy || 0
                      ).toFixed(1)}%
                    </span>

                    <DateText>
                      {item.created_at
                        ? new Date(
                            item.created_at
                          ).toLocaleString()
                        : "--"}
                    </DateText>
                  </HistoryRow>
                ))}
              </HistoryCard>
            )}
          </Section>

          <BottomActions>
            <ActionButton
              onClick={() => navigate("/quiz")}
            >
              Take Another Quiz →
            </ActionButton>
          </BottomActions>
        </Main>
      </Shell>
    </Page>
  );
}

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

const Shell = styled.div`
  width: min(1180px, 88%);
  margin: 0 auto;
  padding-bottom: 60px;
`;

const Header = styled.header`
  min-height: 78px;

  padding: 0 6%;

  display: flex;

  align-items: center;

  justify-content: space-between;

  border-bottom: 1px solid
    rgba(255, 255, 255, 0.07);

  gap: 30px;

  background: transparent;

  @media (max-width: 1100px) {
    padding: 18px 5%;

    flex-direction: column;

    align-items: flex-start;
  }
`;

const Brand = styled.div`
  display: flex;

  align-items: center;

  flex: 0 0 auto;
`;

const Logo = styled.img`
  width: 185px;

  height: auto;

  display: block;
`;

const Nav = styled.nav`
  display: flex;

  align-items: center;

  gap: 28px;

  white-space: nowrap;

  @media (max-width: 1100px) {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
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

  padding: 0;

  background: transparent;

  border: 0;

  cursor: pointer;

  transition: 0.2s;

  white-space: nowrap;

  font-family: inherit;

  &:hover {
    color: white;
  }
`;

const Main = styled.main`
  padding: 46px 0;
`;

const TitleBlock = styled.div`
  margin-bottom: 32px;
`;

const Eyebrow = styled.div`
  color: #9b7ee7;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
  margin-bottom: 9px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(30px, 5vw, 48px);
  letter-spacing: -1.5px;
`;

const Subtitle = styled.p`
  color: #93899d;
  max-width: 680px;
  line-height: 1.7;
  font-size: 14px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  padding: 22px;
  border-radius: 16px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.08);
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 800;
`;

const StatLabel = styled.div`
  margin-top: 7px;
  color: #80768b;
  font-size: 9px;
  letter-spacing: 1.1px;
`;

const Section = styled.section`
  margin-top: 42px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 15px;
`;

const SectionEyebrow = styled.div`
  color: #9b7ee7;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
  margin-bottom: 5px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 20px;
`;

const RefreshButton = styled.button`
  border: 1px solid rgba(139,92,246,0.35);
  background: rgba(124,58,237,0.1);
  color: #c4b5fd;
  border-radius: 8px;
  padding: 7px 11px;
  cursor: pointer;
  font-size: 11px;
`;

const ProgressCard = styled.div`
  padding: 22px;
  border-radius: 16px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.08);
`;

const ProgressTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
`;

const SmallLabel = styled.div`
  color: #80768b;
  font-size: 9px;
  letter-spacing: 1px;
  margin-bottom: 5px;
`;

const BigNumber = styled.div`
  font-size: 22px;
  font-weight: 800;
`;

const ProgressTrack = styled.div`
  height: 7px;
  border-radius: 20px;
  background: rgba(255,255,255,0.07);
  overflow: hidden;
`;

const ProgressFill = styled.div`
  width: ${(props) =>
    Math.max(
      0,
      Math.min(100, props.$width || 0)
    )}%;
  height: 100%;
  border-radius: inherit;
  background: #8b5cf6;
  transition: width 0.4s ease;
`;

const LanguageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const LanguageCard = styled.div`
  padding: 20px;
  border-radius: 16px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.08);
`;

const LanguageTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const LanguageName = styled.h3`
  margin: 0;
  font-size: 16px;
`;

const ScorePill = styled.div`
  color: #c4b5fd;
  font-weight: 800;
  font-size: 15px;
`;

const LanguageMeta = styled.div`
  color: #81778d;
  font-size: 10px;
  margin: 7px 0 17px;
`;

const MiniRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 17px;
`;

const MiniStat = styled.div`
  strong {
    display: block;
    font-size: 14px;
  }

  span {
    display: block;
    color: #80768b;
    font-size: 9px;
    margin-top: 3px;
  }
`;

const HistoryCard = styled.div`
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255,255,255,0.02);
`;

const HistoryHeader = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.7fr 0.8fr 0.8fr 1.3fr;
  gap: 10px;
  padding: 13px 16px;
  color: #716878;
  font-size: 8px;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255,255,255,0.07);

  @media (max-width: 700px) {
    display: none;
  }
`;

const HistoryRow = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.7fr 0.8fr 0.8fr 1.3fr;
  gap: 10px;
  padding: 15px 16px;
  color: #aaa1b1;
  font-size: 11px;
  align-items: center;

  & + & {
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
`;

const ScoreText = styled.strong`
  color: #c4b5fd;
`;

const DateText = styled.span`
  color: #7e7488;
  font-size: 10px;
`;

const EmptyCard = styled.div`
  padding: 34px;
  text-align: center;
  border-radius: 16px;
  border: 1px dashed rgba(255,255,255,0.1);
  color: #81778d;
  font-size: 12px;
  line-height: 1.8;
`;

const ErrorCard = styled.div`
  margin: 100px auto;
  max-width: 520px;
  padding: 28px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.025);

  p {
    color: #948a9f;
    line-height: 1.6;
  }
`;

const LoadingCard = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: #a89db4;
`;

const ActionButton = styled.button`
  border: 1px solid rgba(139,92,246,0.45);
  background: rgba(124,58,237,0.18);
  color: #eee8fa;
  border-radius: 10px;
  padding: 11px 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
`;

const BottomActions = styled.div`
  margin-top: 34px;
  display: flex;
  justify-content: center;
`;
