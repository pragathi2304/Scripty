import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";

const API = "http://localhost:5000";

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

function normalizeLanguage(value) {
  if (!value) return "";

  const aliases = {
    en: "English",
    english: "English",

    hi: "Hindi",
    hindi: "Hindi",

    ja: "Japanese",
    jp: "Japanese",
    japanese: "Japanese",

    ko: "Korean",
    kr: "Korean",
    korean: "Korean",

    ru: "Russian",
    russian: "Russian",
  };

  const key = String(value).trim().toLowerCase();

  return aliases[key] || String(value).trim();
}

function getDisplayCharacter(language, character) {
  const raw = String(character ?? "").trim();

  if (!raw) return "?";

  if (
    normalizeLanguage(language) === "Japanese" &&
    /^\d+$/.test(raw)
  ) {
    const index = Number(raw);

    return JAPANESE_K49_GLYPHS[index] || raw;
  }

  return raw;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

function getAccuracy(attempt) {
  const value = Number(attempt?.accuracy);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function getStatus(accuracy, attempts) {
  if (!attempts) {
    return "Not Practiced";
  }

  if (accuracy >= 80) {
    return "Strong";
  }

  if (accuracy >= 60) {
    return "Improving";
  }

  return "Needs Practice";
}

export default function Performance() {
  const navigate = useNavigate();

  const [progress, setProgress] = useState(null);
  const [languageData, setLanguageData] = useState({});
  const [attempts, setAttempts] = useState([]);

  const [selectedLanguage, setSelectedLanguage] =
    useState("English");

  const [selectedCharacter, setSelectedCharacter] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD PERFORMANCE DATA
  ========================================================= */

  const loadPerformance = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        progressResponse,
        languagesResponse,
        attemptsResponse,
      ] = await Promise.all([
        fetch(`${API}/progress`, {
          credentials: "include",
        }),

        fetch(`${API}/languages`, {
          credentials: "include",
        }),

        fetch(`${API}/attempts?limit=200`, {
          credentials: "include",
        }),
      ]);

      const progressData =
        await progressResponse.json();

      const languagesResult =
        await languagesResponse.json();

      const attemptsResult =
        await attemptsResponse.json();

      if (!progressResponse.ok) {
        throw new Error(
          progressData.message ||
            "Unable to load performance data."
        );
      }

      if (!languagesResponse.ok) {
        throw new Error(
          languagesResult.message ||
            "Unable to load languages."
        );
      }

      if (!attemptsResponse.ok) {
        throw new Error(
          attemptsResult.message ||
            "Unable to load practice history."
        );
      }

      setProgress(progressData);

      setLanguageData(
        languagesResult.languages || {}
      );

      setAttempts(
        Array.isArray(attemptsResult.attempts)
          ? attemptsResult.attempts
          : []
      );
    } catch (err) {
      console.error(
        "Performance loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load performance data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, []);

  /* =========================================================
     LANGUAGE PERFORMANCE
  ========================================================= */

  const languages = useMemo(() => {
    const names = [
      "English",
      "Hindi",
      "Japanese",
      "Korean",
      "Russian",
    ];

    return names.map((name) => {
      const meta = LANGUAGE_META[name];

      const backend =
        progress?.languages?.[name] || {};

      const languageAttempts =
        attempts.filter(
          (attempt) =>
            normalizeLanguage(
              attempt.language
            ) === name
        );

      const accuracy = Number(
        backend.progress || 0
      );

      const practicedCharacters =
        new Set(
          languageAttempts
            .map((attempt) =>
              getDisplayCharacter(
                name,
                attempt.character
              )
            )
            .filter(Boolean)
        );

      return {
        language: name,
        symbol: meta.symbol,
        description: meta.description,
        progress: Number.isFinite(accuracy)
          ? Math.max(
              0,
              Math.min(100, accuracy)
            )
          : 0,
        attempts:
          Number(backend.attempts || 0) ||
          languageAttempts.length,
        characters:
          practicedCharacters.size,
      };
    });
  }, [progress, attempts]);

  /* =========================================================
     CHARACTER PERFORMANCE
  ========================================================= */

  const characters = useMemo(() => {
    const backendCharacters =
      languageData[selectedLanguage] || [];

    const languageProgress =
      progress?.languages?.[
        selectedLanguage
      ] || {};

    const progressCharacters =
      languageProgress.characters || {};

    let characterList = [];

    if (Array.isArray(backendCharacters)) {
      characterList = backendCharacters;
    } else if (
      backendCharacters &&
      typeof backendCharacters === "object"
    ) {
      characterList =
        Object.keys(backendCharacters);
    }

    return characterList.map((character) => {
      const rawCharacter =
        String(character);

      const displayCharacter =
        getDisplayCharacter(
          selectedLanguage,
          rawCharacter
        );

      const data =
        progressCharacters[
          rawCharacter
        ] ||
        progressCharacters[
          displayCharacter
        ] ||
        {};

      const attemptsCount =
        Number(data.attempts || 0);

      const accuracy =
        Number(data.accuracy || 0);

      return {
        character: displayCharacter,

        modelCharacter: rawCharacter,

        language: selectedLanguage,

        accuracy: Number.isFinite(accuracy)
          ? Math.max(
              0,
              Math.min(100, accuracy)
            )
          : 0,

        attempts: attemptsCount,

        status: getStatus(
          accuracy,
          attemptsCount
        ),
      };
    });
  }, [
    languageData,
    progress,
    selectedLanguage,
  ]);

  /* =========================================================
     SELECTED CHARACTER HISTORY
  ========================================================= */

  const characterAttempts = useMemo(() => {
    if (!selectedCharacter) {
      return [];
    }

    return attempts
      .filter((attempt) => {
        const language =
          normalizeLanguage(
            attempt.language
          );

        const character =
          getDisplayCharacter(
            selectedLanguage,
            attempt.character
          );

        return (
          language === selectedLanguage &&
          character ===
            String(selectedCharacter)
        );
      })
      .sort((a, b) => {
        const aTime =
          new Date(
            a.created_at || 0
          ).getTime();

        const bTime =
          new Date(
            b.created_at || 0
          ).getTime();

        return aTime - bTime;
      });
  }, [
    attempts,
    selectedCharacter,
    selectedLanguage,
  ]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const totalAttempts =
    attempts.length;

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

    return (
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / values.length
    );
  }, [attempts]);

  const languagesPracticed =
    new Set(
      attempts
        .map((attempt) =>
          normalizeLanguage(
            attempt.language
          )
        )
        .filter(Boolean)
    ).size;

  const charactersPracticed =
    new Set(
      attempts
        .map((attempt) => {
          const language =
            normalizeLanguage(
              attempt.language
            );

          const character =
            getDisplayCharacter(
              language,
              attempt.character
            );

          if (!language || !character) {
            return null;
          }

          return `${language}-${character}`;
        })
        .filter(Boolean)
    ).size;

  /* =========================================================
     LOGOUT
  ========================================================= */

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

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <LoadingScreen>
        <LoadingSpinner />
        <LoadingText>
          Loading your performance...
        </LoadingText>
      </LoadingScreen>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

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
              <NavLink to="/dashboard">
                Dashboard
              </NavLink>

              <NavLink to="/practice">
                Practice
              </NavLink>

              <NavLink to="/quiz">
                Quiz
              </NavLink>

              <NavLink
                to="/performance"
                $active
              >
                Practice Performance
              </NavLink>

              <NavLink to="/quiz-performance">
                Quiz Performance
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
            Unable to load performance
          </ErrorTitle>

          <ErrorMessage>
            {error}
          </ErrorMessage>

          <RetryButton
            onClick={loadPerformance}
          >
            Try Again
          </RetryButton>
        </ErrorCard>
      </Page>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <Page>

      {/* =====================================================
          SAME NAVBAR AS DASHBOARD
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

            <NavLink to="/dashboard">
              Dashboard
            </NavLink>

            <NavLink to="/practice">
              Practice
            </NavLink>

            <NavLink to="/quiz">
              Quiz
            </NavLink>

            <NavLink
              to="/performance"
              $active
            >
              Practice Performance
            </NavLink>

            <NavLink to="/quiz-performance">
              Quiz Performance
            </NavLink>

            <LogoutButton
              onClick={logout}
            >
              Logout
            </LogoutButton>

          </Nav>

        </RightNav>

      </TopBar>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <Main>

        <Hero>

          <HeroEyebrow>
            LANGUAGE PERFORMANCE
          </HeroEyebrow>

          <HeroTitle>
            Progress by language
          </HeroTitle>

          <HeroSubtitle>
            Your handwriting progress is
            calculated from your actual
            practice attempts.
          </HeroSubtitle>

        </Hero>

        {/* =================================================
            LANGUAGE CARDS
        ================================================= */}

        <LanguageGrid>

          {languages.map((item) => (

            <LanguageCard
              key={item.language}
              $active={
                selectedLanguage ===
                item.language
              }
              onClick={() => {
                setSelectedLanguage(
                  item.language
                );

                setSelectedCharacter(
                  null
                );
              }}
            >

              <LanguageTop>

                <LanguageSymbol>
                  {item.symbol}
                </LanguageSymbol>

                <LanguageInfo>

                  <LanguageName>
                    {item.language}
                  </LanguageName>

                  <LanguageDescription>
                    {item.description}
                  </LanguageDescription>

                </LanguageInfo>

                <LanguagePercentage>
                  {item.progress.toFixed(1)}%
                </LanguagePercentage>

              </LanguageTop>

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
                  {item.characters}{" "}
                  characters practiced
                </span>

              </LanguageFooter>

            </LanguageCard>

          ))}

        </LanguageGrid>

        {/* =================================================
            CHARACTER ANALYSIS
        ================================================= */}

        <Section>

          <SectionHeader>

            <SectionEyebrow>
              CHARACTER PERFORMANCE
            </SectionEyebrow>

            <SectionTitle>
              Character-wise improvement
            </SectionTitle>

            <SectionDescription>
              Select a language and character
              to view your actual handwriting
              performance.
            </SectionDescription>

          </SectionHeader>

          {/* LANGUAGE SELECTOR */}

          <LanguageSelector>

            {languages.map((item) => (

              <LanguageSelectorButton
                key={item.language}
                $active={
                  selectedLanguage ===
                  item.language
                }
                onClick={() => {
                  setSelectedLanguage(
                    item.language
                  );

                  setSelectedCharacter(
                    null
                  );
                }}
              >
                {item.language}
              </LanguageSelectorButton>

            ))}

          </LanguageSelector>

          {/* CHARACTER TABLE */}

          <AnalysisCard>

            <TableHeader>

              <span>
                CHARACTER
              </span>

              <span>
                LANGUAGE
              </span>

              <span>
                ACCURACY
              </span>

              <span>
                STATUS
              </span>

              <span>
                ATTEMPTS
              </span>

            </TableHeader>

            {characters.map((item) => (

              <TableRow
                key={`${item.language}-${item.modelCharacter}`}
                $selected={
                  String(
                    selectedCharacter
                  ) ===
                  String(
                    item.character
                  )
                }
                onClick={() =>
                  setSelectedCharacter(
                    item.character
                  )
                }
              >

                <Character>
                  {item.character}
                </Character>

                <Language>
                  {item.language}
                </Language>

                <Accuracy>
                  {item.accuracy.toFixed(1)}%
                </Accuracy>

                <Status
                  $good={
                    item.accuracy >= 80
                  }
                  $practiced={
                    item.attempts > 0
                  }
                >
                  {item.status}
                </Status>

                <Attempts>
                  {item.attempts}
                </Attempts>

              </TableRow>

            ))}

            {characters.length === 0 && (
              <EmptyRows>
                No characters available
                for this language.
              </EmptyRows>
            )}

          </AnalysisCard>

          {/* =================================================
              SELECTED CHARACTER DETAILS
          ================================================= */}

          {selectedCharacter && (

            <CharacterDetails>

              <DetailHeader>

                <div>

                  <DetailCharacter>
                    {selectedCharacter}
                  </DetailCharacter>

                  <DetailSubtitle>
                    {selectedLanguage}{" "}
                    practice history
                  </DetailSubtitle>

                </div>

                <AverageBox>

                  <AverageValue>
                    {characterAttempts.length
                      ? (
                          characterAttempts.reduce(
                            (
                              sum,
                              attempt
                            ) =>
                              sum +
                              getAccuracy(
                                attempt
                              ),
                            0
                          ) /
                          characterAttempts.length
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </AverageValue>

                  <AverageLabel>
                    Average accuracy
                  </AverageLabel>

                </AverageBox>

              </DetailHeader>

              {characterAttempts.length ===
              0 ? (

                <EmptyHistory>
                  This character has not
                  been practiced yet.
                </EmptyHistory>

              ) : (

                <AttemptList>

                  {characterAttempts.map(
                    (
                      attempt,
                      index
                    ) => (

                      <AttemptCard
                        key={
                          attempt.id ||
                          `${attempt.created_at}-${index}`
                        }
                      >

                        <AttemptTop>

                          <AttemptNumber>
                            Attempt{" "}
                            {index + 1}
                          </AttemptNumber>

                          <AttemptAccuracy>
                            {getAccuracy(
                              attempt
                            ).toFixed(1)}
                            %
                          </AttemptAccuracy>

                        </AttemptTop>

                        <AttemptDate>
                          {formatDate(
                            attempt.created_at
                          )}
                        </AttemptDate>

                        <FeedbackTitle>
                          AI Feedback
                        </FeedbackTitle>

                        <Feedback>
                          {attempt.feedback ||
                            "No feedback available."}
                        </Feedback>

                        <AttemptInfo>

                          <InfoItem>
                            Confidence:{" "}
                            {Number(
                              attempt.confidence ||
                                0
                            ).toFixed(1)}
                            %
                          </InfoItem>

                          <InfoItem
                            $good={
                              Boolean(
                                attempt.is_correct
                              )
                            }
                          >
                            {attempt.is_correct
                              ? "Correct"
                              : "Needs improvement"}
                          </InfoItem>

                        </AttemptInfo>

                      </AttemptCard>

                    )
                  )}

                </AttemptList>

              )}

            </CharacterDetails>

          )}

        </Section>

        {/* =================================================
            OVERALL SUMMARY
        ================================================= */}

        <Section>

          <SectionHeader>

            <SectionEyebrow>
              OVERALL PERFORMANCE
            </SectionEyebrow>

            <SectionTitle>
              Your practice summary
            </SectionTitle>

          </SectionHeader>

          <SummaryGrid>

            <SummaryCard>

              <SummaryValue>
                {totalAttempts}
              </SummaryValue>

              <SummaryLabel>
                Total Attempts
              </SummaryLabel>

            </SummaryCard>

            <SummaryCard>

              <SummaryValue>
                {overallAccuracy.toFixed(1)}%
              </SummaryValue>

              <SummaryLabel>
                Overall Accuracy
              </SummaryLabel>

            </SummaryCard>

            <SummaryCard>

              <SummaryValue>
                {languagesPracticed}
              </SummaryValue>

              <SummaryLabel>
                Languages Practiced
              </SummaryLabel>

            </SummaryCard>

            <SummaryCard>

              <SummaryValue>
                {charactersPracticed}
              </SummaryValue>

              <SummaryLabel>
                Characters Practiced
              </SummaryLabel>

            </SummaryCard>

          </SummaryGrid>

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
   NAVBAR
   EXACT SAME STRUCTURE AS DASHBOARD
============================================================ */

const TopBar = styled.header`
  height: 78px;

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

const BrandLogo = styled.img`
  width: 185px;

  height: auto;

  display: block;
`;

const RightNav = styled.div`
  display: flex;
  align-items: center;
  gap: 28px;
  margin-left: auto;
  min-width: 0;
  max-width: 100%;

  @media (max-width: 1050px) {
    gap: 18px;
    overflow-x: auto;
    padding-left: 18px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 28px;
  min-width: max-content;

  @media (max-width: 1050px) {
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
  margin-bottom: 42px;
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
    50px
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
   LANGUAGE CARDS
============================================================ */

const LanguageGrid = styled.div`
  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 22px;

  @media (max-width: 950px) {
    grid-template-columns:
      repeat(2, 1fr);
  }

  @media (max-width: 650px) {
    grid-template-columns: 1fr;
  }
`;

const LanguageCard = styled.button`
  width: 100%;

  padding: 28px;

  min-height: 175px;

  border-radius: 18px;

  border:
    1px solid
    ${(props) =>
      props.$active
        ? "rgba(167,139,250,0.55)"
        : "rgba(255,255,255,0.08)"};

  background:
    ${(props) =>
      props.$active
        ? "rgba(54,28,90,0.55)"
        : "rgba(35,18,64,0.55)"};

  color: white;

  text-align: left;

  font: inherit;

  cursor: pointer;

  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color:
      rgba(167, 139, 250, 0.45);

    background:
      rgba(48, 25, 82, 0.68);

    transform:
      translateY(-2px);
  }
`;

const LanguageTop = styled.div`
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

  border-radius: 14px;

  background:
    rgba(139, 92, 246, 0.13);

  color: #ffffff;

  font-size: 25px;

  font-weight: 700;
`;

const LanguageInfo = styled.div`
  flex: 1;

  min-width: 0;
`;

const LanguageName = styled.div`
  font-size: 17px;

  font-weight: 750;
`;

const LanguageDescription = styled.div`
  margin-top: 4px;

  color:
    rgba(
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

  white-space: nowrap;
`;

const ProgressTrack = styled.div`
  height: 7px;

  margin-top: 23px;

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
    `${Math.max(
      0,
      Math.min(
        100,
        props.$progress || 0
      )
    )}%`};

  height: 100%;

  border-radius: inherit;

  background:
    linear-gradient(
      90deg,
      #7c3aed,
      #a78bfa
    );

  transition:
    width 0.4s ease;
`;

const LanguageFooter = styled.div`
  margin-top: 13px;

  display: flex;

  justify-content: space-between;

  color:
    rgba(
      255,
      255,
      255,
      0.38
    );

  font-size: 11px;
`;

/* ============================================================
   SECTIONS
============================================================ */

const Section = styled.section`
  margin-top: 70px;
`;

const SectionHeader = styled.div`
  margin-bottom: 24px;
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

  color:
    rgba(
      255,
      255,
      255,
      0.47
    );

  font-size: 14px;
`;

/* ============================================================
   LANGUAGE SELECTOR
============================================================ */

const LanguageSelector = styled.div`
  display: flex;

  gap: 9px;

  margin-bottom: 18px;

  flex-wrap: wrap;
`;

const LanguageSelectorButton =
  styled.button`
    border: 1px solid
      ${(props) =>
        props.$active
          ? "rgba(167,139,250,0.55)"
          : "rgba(255,255,255,0.08)"};

    background:
      ${(props) =>
        props.$active
          ? "rgba(124,58,237,0.16)"
          : "rgba(255,255,255,0.025)"};

    color:
      ${(props) =>
        props.$active
          ? "#b99cff"
          : "#91899f"};

    border-radius: 9px;

    padding: 9px 16px;

    font-family: inherit;

    font-size: 12px;

    cursor: pointer;

    transition: 0.2s;

    &:hover {
      color: #ffffff;

      border-color:
        rgba(
          167,
          139,
          250,
          0.4
        );
    }
  `;

/* ============================================================
   CHARACTER TABLE
============================================================ */

const AnalysisCard = styled.div`
  overflow: hidden;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  border-radius: 18px;

  background:
    rgba(
      20,
      11,
      39,
      0.45
    );
`;

const TableHeader = styled.div`
  display: grid;

  grid-template-columns:
    1fr
    1.3fr
    1fr
    1.4fr
    1fr;

  padding: 17px 28px;

  background:
    rgba(
      255,
      255,
      255,
      0.025
    );

  color: #655d72;

  font-size: 9px;

  letter-spacing: 1.5px;
`;

const TableRow = styled.div`
  display: grid;

  grid-template-columns:
    1fr
    1.3fr
    1fr
    1.4fr
    1fr;

  align-items: center;

  padding: 20px 28px;

  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      0.06
    );

  cursor: pointer;

  background:
    ${(props) =>
      props.$selected
        ? "rgba(124,58,237,0.12)"
        : "transparent"};

  transition:
    background 0.2s ease;

  &:hover {
    background:
      rgba(
        124,
        58,
        237,
        0.08
      );
  }
`;

const Character = styled.div`
  font-family: serif;

  font-size: 28px;
`;

const Language = styled.div`
  color: #aaa2b8;

  font-size: 13px;
`;

const Accuracy = styled.div`
  color: #bca6ff;

  font-size: 14px;

  font-weight: 700;
`;

const Status = styled.div`
  color:
    ${(props) => {
      if (!props.$practiced) {
        return "#71697d";
      }

      return props.$good
        ? "#a99bd0"
        : "#d19aa7";
    }};

  font-size: 12px;
`;

const Attempts = styled.div`
  color: #aaa2b8;

  font-size: 13px;
`;

const EmptyRows = styled.div`
  padding: 35px;

  text-align: center;

  color: #71697d;

  font-size: 13px;
`;

/* ============================================================
   CHARACTER DETAILS
============================================================ */

const CharacterDetails = styled.div`
  margin-top: 24px;

  padding: 30px;

  border-radius: 18px;

  background:
    rgba(
      35,
      18,
      64,
      0.55
    );

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );
`;

const DetailHeader = styled.div`
  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 24px;
`;

const DetailCharacter = styled.div`
  font-family: serif;

  font-size: 48px;
`;

const DetailSubtitle = styled.div`
  margin-top: 4px;

  color: #71697d;

  font-size: 12px;
`;

const AverageBox = styled.div`
  text-align: right;
`;

const AverageValue = styled.div`
  color: #bda7ff;

  font-size: 29px;

  font-weight: 800;
`;

const AverageLabel = styled.div`
  margin-top: 3px;

  color: #71697d;

  font-size: 10px;
`;

const EmptyHistory = styled.div`
  padding: 35px;

  border-radius: 12px;

  background:
    rgba(
      255,
      255,
      255,
      0.025
    );

  color: #71697d;

  text-align: center;

  font-size: 13px;
`;

const AttemptList = styled.div`
  display: flex;

  flex-direction: column;

  gap: 13px;
`;

const AttemptCard = styled.div`
  padding: 21px;

  border-radius: 14px;

  background:
    rgba(
      255,
      255,
      255,
      0.025
    );

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.07
    );
`;

const AttemptTop = styled.div`
  display: flex;

  align-items: center;

  justify-content: space-between;
`;

const AttemptNumber = styled.div`
  color: #aaa2b8;

  font-size: 12px;
`;

const AttemptAccuracy = styled.div`
  color: #bda7ff;

  font-size: 19px;

  font-weight: 800;
`;

const AttemptDate = styled.div`
  margin-top: 5px;

  color: #655d72;

  font-size: 10px;
`;

const FeedbackTitle = styled.div`
  margin-top: 19px;

  margin-bottom: 6px;

  color: #a78bfa;

  font-size: 9px;

  font-weight: 700;

  letter-spacing: 1px;
`;

const Feedback = styled.div`
  color: #aaa2b8;

  font-size: 13px;

  line-height: 1.6;
`;

const AttemptInfo = styled.div`
  display: flex;

  gap: 24px;

  margin-top: 14px;

  flex-wrap: wrap;
`;

const InfoItem = styled.div`
  color:
    ${(props) =>
      props.$good
        ? "#a99bd0"
        : "#81798f"};

  font-size: 11px;
`;

/* ============================================================
   SUMMARY
============================================================ */

const SummaryGrid = styled.div`
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 16px;

  @media (max-width: 850px) {
    grid-template-columns:
      repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  padding: 24px;

  border-radius: 16px;

  background:
    rgba(
      35,
      18,
      64,
      0.55
    );

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.07
    );
`;

const SummaryValue = styled.div`
  color: #bda7ff;

  font-size: 27px;

  font-weight: 800;
`;

const SummaryLabel = styled.div`
  margin-top: 5px;

  color: #71697d;

  font-size: 10px;

  text-transform: uppercase;

  letter-spacing: 0.7px;
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

  background: #0b0718;

  color: white;
`;

const LoadingSpinner = styled.div`
  width: 30px;

  height: 30px;

  border:
    3px solid
    rgba(
      255,
      255,
      255,
      0.1
    );

  border-top-color: #9f7cff;

  border-radius: 50%;

  animation:
    spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  color:
    rgba(
      255,
      255,
      255,
      0.5
    );

  font-size: 13px;
`;

/* ============================================================
   ERROR
============================================================ */

const ErrorCard = styled.div`
  width: min(
    560px,
    88%
  );

  margin: 100px auto;

  padding: 35px;

  text-align: center;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
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

  font-size: 23px;
`;

const ErrorMessage = styled.p`
  margin: 12px 0 22px;

  color:
    rgba(
      255,
      255,
      255,
      0.5
    );

  line-height: 1.6;

  font-size: 13px;
`;

const RetryButton = styled.button`
  border: 0;

  border-radius: 9px;

  padding: 10px 19px;

  background: #7c3aed;

  color: white;

  font-family: inherit;

  font-weight: 700;

  cursor: pointer;

  &:hover {
    background: #8b5cf6;
  }
`;