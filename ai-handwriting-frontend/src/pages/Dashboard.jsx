import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";

const API = "/api";

const LANGUAGE_META = {
  English: {
    symbol: "A",
    description: "English alphabet",
  },
  Hindi: {
    symbol: "अ",
    description: "Hindi characters",
  },
  Japanese: {
    symbol: "あ",
    description: "Japanese Hiragana",
  },
  Korean: {
    symbol: "한",
    description: "Korean characters",
  },
  Russian: {
    symbol: "Я",
    description: "Russian alphabet",
  },
};

const JAPANESE_K49_GLYPHS = [
  "あ",
  "い",
  "う",
  "え",
  "お",
  "か",
  "き",
  "く",
  "け",
  "こ",
  "さ",
  "し",
  "す",
  "せ",
  "そ",
  "た",
  "ち",
  "つ",
  "て",
  "と",
  "な",
  "に",
  "ぬ",
  "ね",
  "の",
  "は",
  "ひ",
  "ふ",
  "へ",
  "ほ",
  "ま",
  "み",
  "む",
  "め",
  "も",
  "や",
  "ゆ",
  "よ",
  "ら",
  "り",
  "る",
  "れ",
  "ろ",
  "わ",
  "ゐ",
  "ゑ",
  "を",
  "ん",
  "ゝ",
];

function getDashboardCharacter(attempt) {
  const raw = String(attempt?.character ?? "").trim();

  if (
    attempt?.language === "Japanese" &&
    /^\d+$/.test(raw)
  ) {
    const index = Number(raw);

    return JAPANESE_K49_GLYPHS[index] || raw;
  }

  return raw || "?";
}

function toDateKey(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getStreakStats(attempts) {
  const uniqueDays = [
    ...new Set(
      (attempts || [])
        .map((attempt) => toDateKey(attempt.created_at))
        .filter(Boolean)
    ),
  ];

  if (!uniqueDays.length) {
    return {
      current: 0,
      best: 0,
      practiceDays: 0,
      practicedToday: false,
    };
  }

  const daySet = new Set(uniqueDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey = toDateKey(today);
  const yesterdayKey = toDateKey(yesterday);

  let current = 0;

  if (daySet.has(todayKey) || daySet.has(yesterdayKey)) {
    const cursor = new Date(
      daySet.has(todayKey) ? today : yesterday
    );

    while (daySet.has(toDateKey(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  let best = 0;
  let running = 0;
  let previous = null;

  const chronologicalDays = [...uniqueDays].sort(
    (a, b) => new Date(a) - new Date(b)
  );

  for (const key of chronologicalDays) {
    if (!previous) {
      running = 1;
    } else {
      const previousDate = new Date(previous);
      const currentDate = new Date(key);

      previousDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      const difference =
        (currentDate - previousDate) /
        (1000 * 60 * 60 * 24);

      running =
        difference === 1
          ? running + 1
          : 1;
    }

    best = Math.max(best, running);
    previous = key;
  }

  return {
    current,
    best,
    practiceDays: uniqueDays.length,
    practicedToday: daySet.has(todayKey),
  };
}

function getProgressPercent(languageData) {
  const value = Number(languageData?.progress);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(value))
  );
}

function getStatus(accuracy) {
  if (accuracy >= 80) return "Strong";
  if (accuracy >= 60) return "Improving";

  return "Needs Practice";
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [attempts, setAttempts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        meResponse,
        progressResponse,
        attemptsResponse,
      ] = await Promise.all([
        fetch(`${API}/auth/me`, {
          credentials: "include",
        }),

        fetch(`${API}/progress`, {
          credentials: "include",
        }),

        fetch(`${API}/attempts?limit=200`, {
          credentials: "include",
        }),
      ]);

      const meData = await meResponse.json();
      const progress = await progressResponse.json();
      const attemptsData = await attemptsResponse.json();

      if (
        !meResponse.ok ||
        !meData.authenticated
      ) {
        localStorage.removeItem("scriptlyUser");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (
        !progressResponse.ok ||
        progress.success === false
      ) {
        throw new Error(
          progress.message ||
            "Unable to load progress."
        );
      }

      if (
        !attemptsResponse.ok ||
        attemptsData.success === false
      ) {
        throw new Error(
          attemptsData.message ||
            "Unable to load practice history."
        );
      }

      setUser(
        meData.user ||
          progress.user ||
          null
      );

      setProgressData(progress);

      setAttempts(
        attemptsData.attempts || []
      );

      if (meData.user) {
        localStorage.setItem(
          "scriptlyUser",
          JSON.stringify(meData.user)
        );
      }
    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const streak = useMemo(
    () => getStreakStats(attempts),
    [attempts]
  );

  const languages = useMemo(() => {
    const backendLanguages =
      progressData?.languages || {};

    return Object.keys(LANGUAGE_META).map(
      (language) => {
        const data =
          backendLanguages[language] || {};

        const characterCount =
          Object.keys(
            data.characters || {}
          ).length;

        return {
          language,

          progress:
            getProgressPercent(data),

          attempts: Number(
            data.attempts || 0
          ),

          totalCharacters: Number(
            data.total_characters ||
              characterCount ||
              0
          ),

          characters:
            data.characters || {},
        };
      }
    );
  }, [progressData]);

  const totalAttempts = attempts.length;

  const practicedCharacters = useMemo(() => {
    const set = new Set();

    for (const attempt of attempts) {
      if (
        attempt?.character !== undefined &&
        attempt?.character !== null
      ) {
        set.add(
          `${attempt.language || "Unknown"}-${attempt.character}`
        );
      }
    }

    return set.size;
  }, [attempts]);

  const overallAccuracy = useMemo(() => {
    const values = attempts
      .map((attempt) =>
        Number(attempt.accuracy)
      )
      .filter((value) =>
        Number.isFinite(value)
      );

    if (!values.length) {
      return 0;
    }

    return Math.round(
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / values.length
    );
  }, [attempts]);

  const recentAttempts = useMemo(() => {
    return [...attempts]
      .sort((a, b) => {
        const aTime = new Date(
          a.created_at || 0
        ).getTime();

        const bTime = new Date(
          b.created_at || 0
        ).getTime();

        return bTime - aTime;
      })
      .slice(0, 5);
  }, [attempts]);

  const logout = async () => {
    try {
      await fetch(
        `${API}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (err) {
      console.error(
        "Logout error:",
        err
      );
    } finally {
      localStorage.removeItem(
        "scriptlyUser"
      );

      navigate("/login", {
        replace: true,
      });
    }
  };

  if (loading) {
    return (
      <LoadingScreen>
        <LoadingSpinner />

        <LoadingText>
          Loading your dashboard...
        </LoadingText>
      </LoadingScreen>
    );
  }

  if (error) {
    return (
      <Page>
        <TopBar>
          <Brand>
            <BrandLogo
              src="/scriptly-logo.png"
              alt="Scriptly"
            />
          </Brand>

          <RightNav>
            <Nav>
              <NavLink
                to="/dashboard"
                $active
              >
                Dashboard
              </NavLink>

              <NavLink to="/practice">
                Practice
              </NavLink>

              <NavLink to="/quiz">
                Quiz
              </NavLink>

              <NavLink to="/performance">
                Practice Performance
              </NavLink>

              <NavLink to="/quiz-performance">
                Quiz Performance
              </NavLink>

              <NavLink to="/profile">
                Profile
              </NavLink>

              <NavLink to="/settings">
                Settings
              </NavLink>

              <LogoutButton
                onClick={logout}
              >
                Logout
              </LogoutButton>
            </Nav>
          </RightNav>
        </TopBar>

        <ErrorCard>
          <ErrorTitle>
            Unable to load dashboard
          </ErrorTitle>

          <ErrorMessage>
            {error}
          </ErrorMessage>

          <RetryButton
            onClick={loadDashboard}
          >
            Try Again
          </RetryButton>
        </ErrorCard>
      </Page>
    );
  }

  return (
    <Page>
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <TopBar>
        <Brand>
          <BrandLogo
            src="/scriptly-logo.png"
            alt="Scriptly"
          />
        </Brand>

        <RightNav>
          <Nav>

            <NavLink
              to="/dashboard"
              $active
            >
              Dashboard
            </NavLink>

            <NavLink to="/practice">
              Practice
            </NavLink>

            <NavLink to="/quiz">
              Quiz
            </NavLink>

            <NavLink to="/performance">
              Practice Performance
            </NavLink>

            <NavLink to="/quiz-performance">
              Quiz Performance
            </NavLink>

            <NavLink to="/profile">
              Profile
            </NavLink>

            <NavLink to="/settings">
              Settings
            </NavLink>

            <LogoutButton
              onClick={logout}
            >
              Logout
            </LogoutButton>

          </Nav>
        </RightNav>
      </TopBar>

      <Main>

        {/* =====================================================
            HERO
        ===================================================== */}

        <Hero>
          <HeroEyebrow>
            YOUR LEARNING SPACE
          </HeroEyebrow>

          <HeroTitle>
            Welcome back
            {user?.name
              ? `, ${user.name}`
              : ""}
            !
          </HeroTitle>

          <HeroSubtitle>
            Keep practicing your handwriting
            and build your language skills one
            character at a time.
          </HeroSubtitle>
        </Hero>

        {/* =====================================================
            PRACTICE STATS
        ===================================================== */}

        <StatsGrid>

          <StatCard>
            <StatIcon>🔥</StatIcon>

            <StatContent>
              <StatLabel>
                Current Streak
              </StatLabel>

              <StatValue>
                {streak.current}

                <StatUnit>
                  {" "}
                  {streak.current === 1
                    ? "day"
                    : "days"}
                </StatUnit>
              </StatValue>

              <StatHint>
                {streak.practicedToday
                  ? "You practiced today"
                  : streak.current > 0
                  ? "Practice today to keep it going"
                  : "Start practicing today"}
              </StatHint>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon>🏆</StatIcon>

            <StatContent>
              <StatLabel>
                Best Streak
              </StatLabel>

              <StatValue>
                {streak.best}

                <StatUnit>
                  {" "}
                  {streak.best === 1
                    ? "day"
                    : "days"}
                </StatUnit>
              </StatValue>

              <StatHint>
                Longest consecutive practice
              </StatHint>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon>✍️</StatIcon>

            <StatContent>
              <StatLabel>
                Practice Attempts
              </StatLabel>

              <StatValue>
                {totalAttempts}
              </StatValue>

              <StatHint>
                All your saved practice attempts
              </StatHint>
            </StatContent>
          </StatCard>

          <StatCard>
            <StatIcon>🎯</StatIcon>

            <StatContent>
              <StatLabel>
                Overall Accuracy
              </StatLabel>

              <StatValue>
                {overallAccuracy}

                <StatUnit>
                  %
                </StatUnit>
              </StatValue>

              <StatHint>
                Based on your practice history
              </StatHint>
            </StatContent>
          </StatCard>

        </StatsGrid>

        {/* =====================================================
            QUIZ
        ===================================================== */}

        <Section>
          <SectionHeader>

            <SectionEyebrow>
              QUIZ & TEST MODE
            </SectionEyebrow>

            <SectionTitle>
              Test Your Skills
            </SectionTitle>

            <SectionDescription>
              Challenge yourself with
              personalized handwriting questions
              based on your learning progress.
            </SectionDescription>

          </SectionHeader>

          <QuizCard>

            <QuizCardContent>

              <QuizIcon>
                🎯
              </QuizIcon>

              <QuizInfo>

                <QuizTitle>
                  Personalized Handwriting Quiz
                </QuizTitle>

                <QuizDescription>
                  Practice characters, test your
                  recognition skills, and measure
                  your accuracy with a separate
                  quiz performance record.
                </QuizDescription>

                <QuizFeatures>

                  <QuizFeature>
                    <span>✓</span>
                    Personalized questions
                  </QuizFeature>

                  <QuizFeature>
                    <span>✓</span>
                    Handwriting recognition
                  </QuizFeature>

                  <QuizFeature>
                    <span>✓</span>
                    Accuracy tracking
                  </QuizFeature>

                  <QuizFeature>
                    <span>✓</span>
                    Separate quiz performance
                  </QuizFeature>

                </QuizFeatures>

              </QuizInfo>

              <QuizButton
                onClick={() =>
                  navigate("/quiz")
                }
              >
                Start Quiz

                <span>→</span>
              </QuizButton>

            </QuizCardContent>

          </QuizCard>
        </Section>

        {/* =====================================================
            LANGUAGE PROGRESS
        ===================================================== */}

        <Section>

          <SectionHeader>

            <SectionEyebrow>
              LANGUAGE PROGRESS
            </SectionEyebrow>

            <SectionTitle>
              Your Learning Progress
            </SectionTitle>

            <SectionDescription>
              Progress is based on the characters
              you have practiced.
            </SectionDescription>

          </SectionHeader>

          <LanguageGrid>

            {languages.map((item) => {
              const meta =
                LANGUAGE_META[
                  item.language
                ];

              return (
                <LanguageCard
                  key={item.language}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/practice?language=${encodeURIComponent(
                        item.language
                      )}`
                    )
                  }
                  aria-label={`Practice ${item.language}`}
                  title={`Practice ${item.language}`}
                >

                  <LanguageCardTop>

                    <LanguageSymbol>
                      {meta.symbol}
                    </LanguageSymbol>

                    <LanguageInfo>

                      <LanguageName>
                        {item.language}
                      </LanguageName>

                      <LanguageDescription>
                        {meta.description}
                      </LanguageDescription>

                    </LanguageInfo>

                    <LanguagePercentage>
                      {item.progress}%
                    </LanguagePercentage>

                  </LanguageCardTop>

                  <ProgressTrack>
                    <ProgressFill
                      $progress={
                        item.progress
                      }
                    />
                  </ProgressTrack>

                  <LanguageFooter>

                    <span>
                      {item.attempts}{" "}
                      {item.attempts === 1
                        ? "attempt"
                        : "attempts"}
                    </span>

                    <span>
                      {item.totalCharacters
                        ? `${item.totalCharacters} characters`
                        : "Characters"}
                    </span>

                  </LanguageFooter>

                </LanguageCard>
              );
            })}

          </LanguageGrid>

        </Section>

        {/* =====================================================
            RECENT PRACTICE
        ===================================================== */}

        <Section>

          <SectionHeader>

            <SectionEyebrow>
              PRACTICE ACTIVITY
            </SectionEyebrow>

            <SectionTitle>
              Recent Practice
            </SectionTitle>

            <SectionDescription>
              Your latest handwriting attempts.
            </SectionDescription>

          </SectionHeader>

          {recentAttempts.length === 0 ? (

            <EmptyCard>

              <EmptyIcon>
                ✍️
              </EmptyIcon>

              <EmptyTitle>
                No practice attempts yet
              </EmptyTitle>

              <EmptyText>
                Start your first handwriting
                practice session to see your
                progress here.
              </EmptyText>

              <PracticeButton
                onClick={() =>
                  navigate("/practice")
                }
              >
                Start Practicing
              </PracticeButton>

            </EmptyCard>

          ) : (

            <ActivityCard>

              {recentAttempts.map(
                (attempt, index) => {

                  const accuracy =
                    Number(
                      attempt.accuracy
                    );

                  const safeAccuracy =
                    Number.isFinite(
                      accuracy
                    )
                      ? Math.max(
                          0,
                          Math.min(
                            100,
                            Math.round(
                              accuracy
                            )
                          )
                        )
                      : 0;

                  const date =
                    attempt.created_at
                      ? new Date(
                          attempt.created_at
                        ).toLocaleString(
                          [],
                          {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "—";

                  return (
                    <ActivityRow
                      key={
                        attempt.id ||
                        index
                      }
                    >

                      <ActivityCharacter>
                        {getDashboardCharacter(
                          attempt
                        )}
                      </ActivityCharacter>

                      <ActivityDetails>

                        <ActivityLanguage>
                          {attempt.language ||
                            "Unknown"}
                        </ActivityLanguage>

                        <ActivityDate>
                          {date}
                        </ActivityDate>

                      </ActivityDetails>

                      <ActivityAccuracy>

                        <AccuracyNumber>
                          {safeAccuracy}%
                        </AccuracyNumber>

                        <AccuracyBar>
                          <AccuracyFill
                            $accuracy={
                              safeAccuracy
                            }
                          />
                        </AccuracyBar>

                      </ActivityAccuracy>

                      <ActivityStatus
                        $status={getStatus(
                          safeAccuracy
                        )}
                      >
                        {getStatus(
                          safeAccuracy
                        )}
                      </ActivityStatus>

                    </ActivityRow>
                  );
                }
              )}

            </ActivityCard>
          )}

          <SmallSummary>

            <SummaryItem>

              <SummaryNumber>
                {streak.practiceDays}
              </SummaryNumber>

              <SummaryLabel>
                Practice days
              </SummaryLabel>

            </SummaryItem>

            <SummaryDivider />

            <SummaryItem>

              <SummaryNumber>
                {practicedCharacters}
              </SummaryNumber>

              <SummaryLabel>
                Characters practiced
              </SummaryLabel>

            </SummaryItem>

            <SummaryDivider />

            <SummaryItem>

              <SummaryNumber>
                {
                  languages.filter(
                    (item) =>
                      item.attempts > 0
                  ).length
                }
              </SummaryNumber>

              <SummaryLabel>
                Languages practiced
              </SummaryLabel>

            </SummaryItem>

          </SmallSummary>

        </Section>

      </Main>
    </Page>
  );
}


/* ============================================================
   PAGE
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


/* ============================================================
   TOP BAR
============================================================ */

const TopBar = styled.header`
  min-height: 78px;

  padding: 0 6%;

  display: flex;

  align-items: center;

  justify-content: space-between;

  border-bottom: 1px solid
    rgba(255, 255, 255, 0.07);

  gap: 30px;

  @media (max-width: 1200px) {
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

const BrandLogo = styled.img`
  width: 185px;

  height: auto;

  display: block;

  @media (max-width: 700px) {
    width: 160px;
  }
`;

const RightNav = styled.div`
  display: flex;

  align-items: center;

  margin-left: auto;

  @media (max-width: 1200px) {
    width: 100%;

    margin-left: 0;

    overflow-x: auto;

    padding-bottom: 5px;
  }
`;

const Nav = styled.nav`
  display: flex;

  align-items: center;

  gap: 28px;

  white-space: nowrap;

  @media (max-width: 1400px) {
    gap: 22px;
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

  transition: color 0.2s ease;

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

  transition: color 0.2s ease;

  white-space: nowrap;

  &:hover {
    color: white;
  }
`;


/* ============================================================
   MAIN
============================================================ */

const Main = styled.main`
  width: min(1240px, 88%);

  margin: 0 auto;

  padding: 58px 0 90px;
`;


/* ============================================================
   HERO
============================================================ */

const Hero = styled.section`
  margin-bottom: 38px;
`;

const HeroEyebrow = styled.div`
  color: #9f7cff;

  font-size: 12px;

  font-weight: 800;

  letter-spacing: 3px;

  margin-bottom: 12px;
`;

const HeroTitle = styled.h1`
  margin: 0;

  font-size: clamp(
    34px,
    5vw,
    58px
  );

  line-height: 1.08;

  letter-spacing: -1.8px;
`;

const HeroSubtitle = styled.p`
  margin: 14px 0 0;

  max-width: 680px;

  color: rgba(
    255,
    255,
    255,
    0.56
  );

  font-size: 16px;

  line-height: 1.7;
`;


/* ============================================================
   STATS
============================================================ */

const StatsGrid = styled.div`
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 16px;

  margin-bottom: 62px;

  @media (max-width: 1050px) {
    grid-template-columns:
      repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  min-height: 142px;

  padding: 22px;

  display: flex;

  align-items: flex-start;

  gap: 16px;

  border: 1px solid
    rgba(
      180,
      140,
      255,
      0.13
    );

  border-radius: 18px;

  background:
    linear-gradient(
      145deg,
      rgba(65, 34, 108, 0.42),
      rgba(34, 17, 63, 0.56)
    );

  box-shadow:
    0 16px 45px
    rgba(0, 0, 0, 0.14);
`;

const StatIcon = styled.div`
  width: 46px;

  height: 46px;

  display: grid;

  place-items: center;

  flex: 0 0 auto;

  border-radius: 14px;

  background:
    rgba(
      139,
      92,
      246,
      0.14
    );

  font-size: 22px;
`;

const StatContent = styled.div`
  min-width: 0;
`;

const StatLabel = styled.div`
  color: rgba(
    255,
    255,
    255,
    0.55
  );

  font-size: 12px;

  font-weight: 700;

  letter-spacing: 0.8px;

  text-transform: uppercase;
`;

const StatValue = styled.div`
  margin-top: 6px;

  font-size: 29px;

  font-weight: 800;
`;

const StatUnit = styled.span`
  font-size: 14px;

  font-weight: 600;

  color: rgba(
    255,
    255,
    255,
    0.52
  );
`;

const StatHint = styled.div`
  margin-top: 6px;

  color: rgba(
    255,
    255,
    255,
    0.42
  );

  font-size: 12px;

  line-height: 1.4;
`;


/* ============================================================
   SECTIONS
============================================================ */

const Section = styled.section`
  margin-top: 60px;
`;

const SectionHeader = styled.div`
  margin-bottom: 22px;
`;

const SectionEyebrow = styled.div`
  color: #9f7cff;

  font-size: 11px;

  font-weight: 800;

  letter-spacing: 2.5px;

  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  margin: 0;

  font-size: 28px;

  letter-spacing: -0.7px;
`;

const SectionDescription = styled.p`
  margin: 7px 0 0;

  color: rgba(
    255,
    255,
    255,
    0.47
  );

  font-size: 14px;
`;


/* ============================================================
   QUIZ
============================================================ */

const QuizCard = styled.div`
  padding: 26px;

  border: 1px solid
    rgba(
      180,
      140,
      255,
      0.16
    );

  border-radius: 20px;

  background:
    radial-gradient(
      circle at 90% 20%,
      rgba(
        139,
        92,
        246,
        0.18
      ),
      transparent 35%
    ),
    linear-gradient(
      145deg,
      rgba(65, 34, 108, 0.42),
      rgba(34, 17, 63, 0.56)
    );

  box-shadow:
    0 16px 45px
    rgba(0, 0, 0, 0.14);
`;

const QuizCardContent = styled.div`
  display: flex;

  align-items: center;

  gap: 22px;

  @media (max-width: 760px) {
    flex-direction: column;

    align-items: flex-start;
  }
`;

const QuizIcon = styled.div`
  width: 62px;

  height: 62px;

  display: grid;

  place-items: center;

  flex: 0 0 auto;

  border-radius: 17px;

  background:
    rgba(
      139,
      92,
      246,
      0.16
    );

  font-size: 28px;
`;

const QuizInfo = styled.div`
  flex: 1;

  min-width: 0;
`;

const QuizTitle = styled.h3`
  margin: 0;

  font-size: 20px;

  font-weight: 800;
`;

const QuizDescription = styled.p`
  margin: 7px 0 0;

  max-width: 650px;

  color: rgba(
    255,
    255,
    255,
    0.48
  );

  font-size: 13px;

  line-height: 1.6;
`;

const QuizFeatures = styled.div`
  display: flex;

  flex-wrap: wrap;

  gap: 8px 18px;

  margin-top: 14px;
`;

const QuizFeature = styled.div`
  color: rgba(
    255,
    255,
    255,
    0.58
  );

  font-size: 11px;

  span {
    margin-right: 5px;

    color: #b99cff;

    font-weight: 800;
  }
`;

const QuizButton = styled.button`
  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 10px;

  flex: 0 0 auto;

  padding: 12px 20px;

  border: 0;

  border-radius: 11px;

  background: #7c3aed;

  color: #ffffff;

  font-size: 13px;

  font-weight: 750;

  cursor: pointer;

  transition:
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;

  span {
    font-size: 16px;
  }

  &:hover {
    background: #8b5cf6;

    transform: translateY(-1px);

    box-shadow:
      0 8px 24px
      rgba(
        124,
        58,
        237,
        0.25
      );
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 760px) {
    width: 100%;
  }
`;


/* ============================================================
   LANGUAGE PROGRESS
============================================================ */

const LanguageGrid = styled.div`
  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 16px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const LanguageCard = styled.button`
  width: 100%;

  padding: 22px;

  border: 1px solid
    rgba(
      180,
      140,
      255,
      0.13
    );

  border-radius: 18px;

  background:
    rgba(
      35,
      18,
      64,
      0.55
    );

  color: #ffffff;

  text-align: left;

  font: inherit;

  cursor: pointer;

  appearance: none;

  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color:
      rgba(
        167,
        139,
        250,
        0.42
      );

    background:
      rgba(
        48,
        25,
        82,
        0.68
      );

    transform:
      translateY(-2px);

    box-shadow:
      0 12px 30px
      rgba(
        0,
        0,
        0,
        0.16
      );
  }

  &:focus-visible {
    outline:
      2px solid #9f7cff;

    outline-offset: 3px;
  }

  &:active {
    transform:
      translateY(0);
  }
`;

const LanguageCardTop = styled.div`
  display: flex;

  align-items: center;

  gap: 14px;
`;

const LanguageSymbol = styled.div`
  width: 52px;

  height: 52px;

  display: grid;

  place-items: center;

  flex: 0 0 auto;

  border-radius: 15px;

  background:
    rgba(
      139,
      92,
      246,
      0.13
    );

  color: #ffffff;

  font-size: 24px;

  font-weight: 700;
`;

const LanguageInfo = styled.div`
  min-width: 0;

  flex: 1;
`;

const LanguageName = styled.div`
  font-size: 17px;

  font-weight: 750;
`;

const LanguageDescription = styled.div`
  margin-top: 4px;

  color: rgba(
    255,
    255,
    255,
    0.42
  );

  font-size: 12px;
`;

const LanguagePercentage = styled.div`
  font-size: 22px;

  font-weight: 800;
`;

const ProgressTrack = styled.div`
  width: 100%;

  height: 8px;

  margin-top: 22px;

  overflow: hidden;

  border-radius: 999px;

  background:
    rgba(
      255,
      255,
      255,
      0.08
    );
`;

const ProgressFill = styled.div`
  width: ${(props) =>
    `${props.$progress}%`};

  height: 100%;

  border-radius: inherit;

  background:
    linear-gradient(
      90deg,
      #7c3aed,
      #a78bfa
    );

  transition:
    width 0.5s ease;
`;

const LanguageFooter = styled.div`
  margin-top: 12px;

  display: flex;

  justify-content:
    space-between;

  color: rgba(
    255,
    255,
    255,
    0.38
  );

  font-size: 11px;
`;


/* ============================================================
   ACTIVITY
============================================================ */

const ActivityCard = styled.div`
  overflow: hidden;

  border: 1px solid
    rgba(
      180,
      140,
      255,
      0.13
    );

  border-radius: 18px;

  background:
    rgba(
      35,
      18,
      64,
      0.55
    );
`;

const ActivityRow = styled.div`
  min-height: 80px;

  padding: 14px 20px;

  display: flex;

  align-items: center;

  gap: 18px;

  border-bottom:
    1px solid
    rgba(
      255,
      255,
      255,
      0.055
    );

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 650px) {
    flex-wrap: wrap;
  }
`;

const ActivityCharacter = styled.div`
  width: 50px;

  height: 50px;

  display: grid;

  place-items: center;

  flex: 0 0 auto;

  border-radius: 13px;

  background:
    rgba(
      139,
      92,
      246,
      0.13
    );

  font-size: 23px;

  font-weight: 700;
`;

const ActivityDetails = styled.div`
  flex: 1;

  min-width: 130px;
`;

const ActivityLanguage = styled.div`
  font-size: 14px;

  font-weight: 700;
`;

const ActivityDate = styled.div`
  margin-top: 5px;

  color: rgba(
    255,
    255,
    255,
    0.38
  );

  font-size: 11px;
`;

const ActivityAccuracy = styled.div`
  width: 170px;

  @media (max-width: 650px) {
    width: 100%;

    order: 4;
  }
`;

const AccuracyNumber = styled.div`
  margin-bottom: 6px;

  font-size: 12px;

  font-weight: 700;

  text-align: right;

  color: rgba(
    255,
    255,
    255,
    0.72
  );
`;

const AccuracyBar = styled.div`
  height: 5px;

  overflow: hidden;

  border-radius: 999px;

  background:
    rgba(
      255,
      255,
      255,
      0.08
    );
`;

const AccuracyFill = styled.div`
  width: ${(props) =>
    `${props.$accuracy}%`};

  height: 100%;

  border-radius: inherit;

  background: #9f7cff;
`;

const ActivityStatus = styled.div`
  width: 110px;

  text-align: right;

  font-size: 11px;

  font-weight: 700;

  color: ${(props) => {
    if (
      props.$status ===
      "Strong"
    ) {
      return "#b9a2ff";
    }

    if (
      props.$status ===
      "Improving"
    ) {
      return "#d4c6ff";
    }

    return "#e5b8ff";
  }};

  @media (max-width: 650px) {
    width: auto;
  }
`;


/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyCard = styled.div`
  padding: 52px 24px;

  text-align: center;

  border: 1px solid
    rgba(
      180,
      140,
      255,
      0.13
    );

  border-radius: 18px;

  background:
    rgba(
      35,
      18,
      64,
      0.55
    );
`;

const EmptyIcon = styled.div`
  font-size: 34px;

  margin-bottom: 14px;
`;

const EmptyTitle = styled.h3`
  margin: 0;

  font-size: 19px;
`;

const EmptyText = styled.p`
  max-width: 440px;

  margin: 8px auto 20px;

  color: rgba(
    255,
    255,
    255,
    0.45
  );

  line-height: 1.6;

  font-size: 13px;
`;

const PracticeButton = styled.button`
  border: 0;

  border-radius: 10px;

  padding: 11px 18px;

  background: #7c3aed;

  color: #ffffff;

  font-weight: 700;

  cursor: pointer;

  &:hover {
    background: #8b5cf6;
  }
`;


/* ============================================================
   SUMMARY
============================================================ */

const SmallSummary = styled.div`
  margin-top: 16px;

  padding: 18px 24px;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 42px;

  border: 1px solid
    rgba(
      180,
      140,
      255,
      0.1
    );

  border-radius: 16px;

  background:
    rgba(
      30,
      15,
      55,
      0.4
    );

  @media (max-width: 650px) {
    gap: 18px;

    justify-content:
      space-between;
  }
`;

const SummaryItem = styled.div`
  text-align: center;
`;

const SummaryNumber = styled.div`
  font-size: 21px;

  font-weight: 800;
`;

const SummaryLabel = styled.div`
  margin-top: 4px;

  color: rgba(
    255,
    255,
    255,
    0.4
  );

  font-size: 10px;

  text-transform: uppercase;

  letter-spacing: 0.7px;
`;

const SummaryDivider = styled.div`
  width: 1px;

  height: 35px;

  background:
    rgba(
      255,
      255,
      255,
      0.1
    );

  @media (max-width: 650px) {
    display: none;
  }
`;


/* ============================================================
   LOADING
============================================================ */

const LoadingScreen = styled.div`
  min-height: 100vh;

  display: grid;

  place-items: center;

  align-content: center;

  gap: 14px;

  background: #140b2b;

  color: #ffffff;
`;

const LoadingSpinner = styled.div`
  width: 32px;

  height: 32px;

  border:
    3px solid
    rgba(
      255,
      255,
      255,
      0.12
    );

  border-top-color:
    #9f7cff;

  border-radius: 50%;

  animation:
    spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(
        360deg
      );
    }
  }
`;

const LoadingText = styled.div`
  color: rgba(
    255,
    255,
    255,
    0.55
  );

  font-size: 14px;
`;


/* ============================================================
   ERROR
============================================================ */

const ErrorCard = styled.div`
  width: min(560px, 88%);

  margin: 100px auto;

  padding: 35px;

  text-align: center;

  border: 1px solid
    rgba(
      180,
      140,
      255,
      0.13
    );

  border-radius: 18px;

  background:
    rgba(
      35,
      18,
      64,
      0.65
    );
`;

const ErrorTitle = styled.h2`
  margin: 0;

  font-size: 24px;
`;

const ErrorMessage = styled.p`
  margin: 12px 0 22px;

  color: rgba(
    255,
    255,
    255,
    0.52
  );

  line-height: 1.6;
`;

const RetryButton = styled.button`
  border: 0;

  border-radius: 10px;

  padding: 11px 20px;

  background: #7c3aed;

  color: #ffffff;

  font-weight: 700;

  cursor: pointer;

  &:hover {
    background: #8b5cf6;
  }
`;