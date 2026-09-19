import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import styled from "styled-components";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import DrawingCanvas from "../components/DrawingCanvas";


// ============================================================
// JAPANESE KUZUSHIJI-49
// MODEL INDEX -> HIRAGANA
// ============================================================

const JAPANESE_K49 = [
  "あ", "い", "う", "え", "お",
  "か", "き", "く", "け", "こ",
  "さ", "し", "す", "せ", "そ",
  "た", "ち", "つ", "て", "と",
  "な", "に", "ぬ", "ね", "の",
  "は", "ひ", "ふ", "へ", "ほ",
  "ま", "み", "む", "め", "も",
  "や", "ゆ", "よ",
  "ら", "り", "る", "れ", "ろ",
  "わ", "ゐ", "ゑ", "を", "ん", "ゝ",
];


// ============================================================
// RUSSIAN STANDARD ORDER
// ============================================================

const RUSSIAN_ORDER = [
  "А",
  "Б",
  "В",
  "Г",
  "Д",
  "Е",
  "Ё",
  "Ж",
  "З",
  "И",
  "Й",
  "К",
  "Л",
  "М",
  "Н",
  "О",
  "П",
  "Р",
  "С",
  "Т",
  "У",
  "Ф",
  "Х",
  "Ц",
  "Ч",
  "Ш",
  "Щ",
  "Ъ",
  "Ы",
  "Ь",
  "Э",
  "Ю",
  "Я",
];


// ============================================================
// HINDI
// ============================================================

const HINDI_MAP = {
  ka: "क",
  kha: "ख",
  ga: "ग",
  gha: "घ",
  kna: "ङ",

  cha: "च",
  chha: "छ",
  ja: "ज",
  jha: "झ",
  yna: "ञ",

  taamatar: "ट",
  thaa: "ठ",
  daa: "ड",
  dhaa: "ढ",
  adna: "ण",

  ta: "त",
  tha: "थ",
  da: "द",
  dha: "ध",
  na: "न",

  pa: "प",
  pha: "फ",
  ba: "ब",
  bha: "भ",
  ma: "म",

  yaw: "य",
  ra: "र",
  la: "ल",
  waw: "व",

  motosaw: "श",
  patalosaw: "ष",
  tabala: "स",
  ha: "ह",

  petchiryakha: "क्ष",
  tra: "त्र",
  gya: "ज्ञ",
  chhya: "श्र",
};


// ============================================================
// KOREAN
// ============================================================

const KOREAN_MAP = {
  a: "아",
  bak: "박",
  bo: "보",
  bu: "부",
  choe: "최",
  da: "다",
  dae: "대",
  deul: "들",
  do: "도",
  dong: "동",

  e: "에",
  eo: "어",
  eu: "으",
  eui: "의",
  eul: "을",
  eun: "은",

  ga: "가",
  geos: "것",
  geu: "그",
  gi: "기",
  gim: "김",
  go: "고",
  gong: "공",
  gu: "구",
  guk: "국",
  gwa: "과",
  gye: "계",
  gyeong: "경",

  ha: "하",
  hae: "해",
  han: "한",
  hwa: "화",

  i: "이",
  il: "일",
  in: "인",
  iss: "있",

  ja: "자",
  jang: "장",
  je: "제",
  jeok: "적",
  jeon: "전",
  jeong: "정",
  ji: "지",
  jo: "조",
  ju: "주",

  na: "나",
  neun: "는",

  ra: "라",
  reul: "를",
  ri: "리",
  ro: "로",

  sa: "사",
  sang: "상",
  seo: "서",
  seong: "성",
  seu: "스",
  si: "시",
  so: "소",
  su: "수",

  wi: "위",
  won: "원",

  yeo: "여",
  yeon: "연",
  yong: "용",
};


// ============================================================
// HINDI CHARACTER LIST
// ============================================================

const HINDI_CONSONANTS = [
  ["ka", "क"],
  ["kha", "ख"],
  ["ga", "ग"],
  ["gha", "घ"],
  ["kna", "ङ"],

  ["cha", "च"],
  ["chha", "छ"],
  ["ja", "ज"],
  ["jha", "झ"],
  ["yna", "ञ"],

  ["taamatar", "ट"],
  ["thaa", "ठ"],
  ["daa", "ड"],
  ["dhaa", "ढ"],
  ["adna", "ण"],

  ["ta", "त"],
  ["tha", "थ"],
  ["da", "द"],
  ["dha", "ध"],
  ["na", "न"],

  ["pa", "प"],
  ["pha", "फ"],
  ["ba", "ब"],
  ["bha", "भ"],
  ["ma", "म"],

  ["yaw", "य"],
  ["ra", "र"],
  ["la", "ल"],
  ["waw", "व"],

  ["motosaw", "श"],
  ["patalosaw", "ष"],
  ["tabala", "स"],
  ["ha", "ह"],
];


// ============================================================
// HINDI COMBINATIONS
// ============================================================

const HINDI_COMBINATIONS = [
  ["petchiryakha", "क्ष"],
  ["tra", "त्र"],
  ["gya", "ज्ञ"],
  ["chhya", "श्र"],
];


// ============================================================
// LANGUAGES
// ============================================================

const LANGUAGE_INFO = [
  {
    name: "English",
    display: "English",
    code: "EN",
    short: "GB",
  },

  {
    name: "Hindi",
    display: "हिंदी",
    code: "HI",
    short: "IN",
  },

  {
    name: "Japanese",
    display: "日本語",
    code: "JP",
    short: "JP",
  },

  {
    name: "Korean",
    display: "한국어",
    code: "KR",
    short: "KR",
  },

  {
    name: "Russian",
    display: "Русский",
    code: "RU",
    short: "RU",
  },
];


// ============================================================
// CHARACTER LEARNING DATA
// ============================================================

const JAPANESE_ROMAJI = {
  "あ":"a", "い":"i", "う":"u", "え":"e", "お":"o",
  "か":"ka", "き":"ki", "く":"ku", "け":"ke", "こ":"ko",
  "さ":"sa", "し":"shi", "す":"su", "せ":"se", "そ":"so",
  "た":"ta", "ち":"chi", "つ":"tsu", "て":"te", "と":"to",
  "な":"na", "に":"ni", "ぬ":"nu", "ね":"ne", "の":"no",
  "は":"ha", "ひ":"hi", "ふ":"fu", "へ":"he", "ほ":"ho",
  "ま":"ma", "み":"mi", "む":"mu", "め":"me", "も":"mo",
  "や":"ya", "ゆ":"yu", "よ":"yo",
  "ら":"ra", "り":"ri", "る":"ru", "れ":"re", "ろ":"ro",
  "わ":"wa", "ゐ":"wi", "ゑ":"we", "を":"wo", "ん":"n", "ゝ":"",
};

const RUSSIAN_ROMANIZATION = {
  "А":"A", "Б":"B", "В":"V", "Г":"G", "Д":"D", "Е":"Ye",
  "Ё":"Yo", "Ж":"Zh", "З":"Z", "И":"I", "Й":"Y", "К":"K",
  "Л":"L", "М":"M", "Н":"N", "О":"O", "П":"P", "Р":"R",
  "С":"S", "Т":"T", "У":"U", "Ф":"F", "Х":"Kh", "Ц":"Ts",
  "Ч":"Ch", "Ш":"Sh", "Щ":"Shch", "Ъ":"", "Ы":"Y", "Ь":"",
  "Э":"E", "Ю":"Yu", "Я":"Ya",
};

const ENGLISH_LETTER_NAMES = {
  A:"ay", B:"bee", C:"see", D:"dee", E:"ee", F:"ef", G:"gee",
  H:"aitch", I:"eye", J:"jay", K:"kay", L:"el", M:"em", N:"en",
  O:"oh", P:"pee", Q:"cue", R:"ar", S:"ess", T:"tee", U:"you",
  V:"vee", W:"double-you", X:"ex", Y:"why", Z:"zee",
};

const getCharacterLearningInfo = (language, character) => {
  const glyph = String(character || "");

  if (language === "English") {
    return { pronunciation: ENGLISH_LETTER_NAMES[glyph.toUpperCase()] || glyph, script: "Latin alphabet", tip: "Keep the strokes connected and follow the guide for consistent proportions.", speechLang: "en-US" };
  }

  if (language === "Hindi") {
    const item = HINDI_CONSONANTS.find(([, value]) => value === glyph);
    return { pronunciation: item ? item[0] : "Hindi character", script: "Devanagari", tip: "Follow the guide carefully and keep the character centered on the canvas.", speechLang: "hi-IN" };
  }

  if (language === "Japanese") {
    return { pronunciation: JAPANESE_ROMAJI[glyph] || "Japanese character", script: "Hiragana", tip: "Write each stroke deliberately and keep the character balanced inside the guide.", speechLang: "ja-JP" };
  }

  if (language === "Korean") {
    const entry = Object.entries(KOREAN_MAP).find(([, value]) => value === glyph);
    return { pronunciation: entry ? entry[0] : "Korean character", script: "Hangul", tip: "Keep each stroke clear and maintain even spacing within the character.", speechLang: "ko-KR" };
  }

  return { pronunciation: RUSSIAN_ROMANIZATION[glyph] || "Russian character", script: "Cyrillic alphabet", tip: "Follow the guide and aim for a steady, centered character shape.", speechLang: "ru-RU" };
};


// ============================================================
// PRACTICE
// ============================================================

function Practice() {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await fetch("https://scripty-backend-zd0r.onrender.com/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("scriptlyUser");
      navigate("/login", { replace: true });
    }
  };

  const [searchParams] =
    useSearchParams();

  const canvasRef =
    useRef(null);


  const requestedLanguage =
    searchParams.get("language");

  const requestedCharacter =
    searchParams.get("character");


  const initialLanguage =
    LANGUAGE_INFO.some(
      (item) =>
        item.name ===
        requestedLanguage
    )
      ? requestedLanguage
      : "English";


  const [
    language,
    setLanguage,
  ] = useState(
    initialLanguage
  );


  const [
    languageCharacters,
    setLanguageCharacters,
  ] = useState({});


  const [
    isLoadingCharacters,
    setIsLoadingCharacters,
  ] = useState(true);


  const [
    character,
    setCharacter,
  ] = useState("");


  const [
    drawingData,
    setDrawingData,
  ] = useState([]);


  const [
    tool,
    setTool,
  ] = useState("pen");


  const [
    result,
    setResult,
  ] = useState(null);


  const [
    isRecognizing,
    setIsRecognizing,
  ] = useState(false);


  // ==========================================================
  // LOAD BACKEND LANGUAGES
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadCharacters =
      async () => {
        try {
          setIsLoadingCharacters(
            true
          );

          const response =
            await fetch(
              "https://scripty-backend-zd0r.onrender.com/languages"
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            data.status !==
              "success"
          ) {
            throw new Error(
              data.message ||
                "Unable to load characters."
            );
          }

          if (!cancelled) {
            setLanguageCharacters(
              data.languages || {}
            );
          }
        } catch (error) {
          console.error(
            "Character loading error:",
            error
          );

          if (!cancelled) {
            setLanguageCharacters({});
          }
        } finally {
          if (!cancelled) {
            setIsLoadingCharacters(
              false
            );
          }
        }
      };

    loadCharacters();

    return () => {
      cancelled = true;
    };
  }, []);


  // ==========================================================
  // CHARACTER ORDER
  // ==========================================================

  const currentCharacters =
    useMemo(() => {

      // ------------------------------------------------------
      // HINDI
      // ------------------------------------------------------

      if (
        language === "Hindi"
      ) {
        return [
          ...HINDI_CONSONANTS.map(
            ([label]) => label
          ),

          ...HINDI_COMBINATIONS.map(
            ([label]) => label
          ),
        ];
      }


      // ------------------------------------------------------
      // JAPANESE
      //
      // UI displays あいう...
      // Backend receives 0,1,2...
      // ------------------------------------------------------

      if (
        language === "Japanese"
      ) {
        return JAPANESE_K49.map(
          (_, index) =>
            String(index)
        );
      }


      // ------------------------------------------------------
      // ENGLISH A-Z
      // ------------------------------------------------------

      if (
        language === "English"
      ) {
        const alphabet =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
            ""
          );

        const backend =
          languageCharacters[
            "English"
          ] || [];

        const available =
          new Set(
            backend.map(
              (item) =>
                String(item)
                  .trim()
                  .toUpperCase()
            )
          );

        const ordered =
          alphabet.filter(
            (letter) =>
              available.has(letter)
          );

        return ordered.length
          ? ordered
          : alphabet;
      }


      // ------------------------------------------------------
      // RUSSIAN
      // ------------------------------------------------------

      if (
        language === "Russian"
      ) {
        const backend =
          languageCharacters[
            "Russian"
          ] || [];

        const available =
          new Set(
            backend.map(
              (item) =>
                String(item)
                  .trim()
                  .toUpperCase()
            )
          );

        const ordered =
          RUSSIAN_ORDER.filter(
            (letter) =>
              available.has(letter)
          );

        return ordered.length
          ? ordered
          : RUSSIAN_ORDER;
      }


      // ------------------------------------------------------
      // KOREAN
      // ------------------------------------------------------

      return (
        languageCharacters[
          language
        ] || []
      );

    }, [
      language,
      languageCharacters,
    ]);


  // ==========================================================
  // DISPLAY CHARACTER
  // ==========================================================

  const getDisplayCharacter =
    (modelLabel) => {

      if (
        modelLabel ===
          undefined ||
        modelLabel ===
          null ||
        modelLabel === ""
      ) {
        return "";
      }

      const raw =
        String(
          modelLabel
        ).trim();

      const clean =
        raw.toLowerCase();


      // ------------------------------------------------------
      // HINDI
      // ------------------------------------------------------

      if (
        language === "Hindi"
      ) {
        return (
          HINDI_MAP[
            clean
          ] || raw
        );
      }


      // ------------------------------------------------------
      // JAPANESE
      // ------------------------------------------------------

      if (
        language === "Japanese"
      ) {
        const index =
          Number(raw);

        if (
          Number.isInteger(index) &&
          index >= 0 &&
          index <
            JAPANESE_K49.length
        ) {
          return JAPANESE_K49[
            index
          ];
        }

        return raw;
      }


      // ------------------------------------------------------
      // KOREAN
      // ------------------------------------------------------

      if (
        language === "Korean"
      ) {
        return (
          KOREAN_MAP[
            clean
          ] || raw
        );
      }


      // ------------------------------------------------------
      // RUSSIAN
      // ------------------------------------------------------

      if (
        language === "Russian"
      ) {
        return raw.toUpperCase();
      }


      // ------------------------------------------------------
      // ENGLISH
      // ------------------------------------------------------

      return raw.toUpperCase();
    };


  // ==========================================================
  // SET FIRST CHARACTER
  // ==========================================================

  useEffect(() => {
    if (
      currentCharacters.length ===
      0
    ) {
      setCharacter("");
      return;
    }

    // Respect a character supplied by Dashboard/Performance.
    // This prevents Practice from always falling back to the
    // first character (for example A) when a specific character
    // such as 4 or B was selected.
    if (
      requestedCharacter &&
      currentCharacters.includes(requestedCharacter)
    ) {
      setCharacter(requestedCharacter);
      return;
    }

    setCharacter(
      (previous) => {
        if (
          currentCharacters.includes(
            previous
          )
        ) {
          return previous;
        }

        return currentCharacters[0];
      }
    );
  }, [
    currentCharacters,
    requestedCharacter,
  ]);


  // ==========================================================
  // LANGUAGE CHANGE
  // ==========================================================

  const handleLanguageChange =
    (newLanguage) => {

      setLanguage(
        newLanguage
      );

      setCharacter("");

      setDrawingData([]);

      setResult(null);

      setTool("pen");

      if (
        canvasRef.current
      ) {
        canvasRef.current.clear();
      }
    };


  // ==========================================================
  // CHARACTER CHANGE
  // ==========================================================

  const handleCharacterChange =
    (newCharacter) => {

      setCharacter(
        newCharacter
      );

      setDrawingData([]);

      setResult(null);

      setTool("pen");

      if (
        canvasRef.current
      ) {
        canvasRef.current.clear();
      }
    };


  // ==========================================================
  // NEXT
  // ==========================================================

  const handleNext = () => {

    if (
      currentCharacters.length ===
      0
    ) {
      return;
    }

    const index =
      currentCharacters.indexOf(
        character
      );

    const nextIndex =
      index < 0 ||
      index >=
        currentCharacters.length -
          1
        ? 0
        : index + 1;

    setCharacter(
      currentCharacters[
        nextIndex
      ]
    );

    setDrawingData([]);

    setResult(null);

    setTool("pen");

    if (
      canvasRef.current
    ) {
      canvasRef.current.clear();
    }
  };


  // ==========================================================
  // PREVIOUS
  // ==========================================================

  const handlePrevious = () => {
    if (currentCharacters.length === 0) return;

    const index = currentCharacters.indexOf(character);
    const previousIndex =
      index <= 0
        ? currentCharacters.length - 1
        : index - 1;

    setCharacter(currentCharacters[previousIndex]);
    setDrawingData([]);
    setResult(null);
    setTool("pen");

    if (canvasRef.current) {
      canvasRef.current.clear();
    }
  };


  // ==========================================================
  // RANDOM
  // ==========================================================

  const handleRandom = () => {

    if (
      currentCharacters.length ===
      0
    ) {
      return;
    }

    if (
      currentCharacters.length ===
      1
    ) {
      return;
    }

    let randomIndex;

    do {
      randomIndex =
        Math.floor(
          Math.random() *
            currentCharacters.length
        );
    } while (
      currentCharacters[
        randomIndex
      ] === character
    );

    setCharacter(
      currentCharacters[
        randomIndex
      ]
    );

    setDrawingData([]);

    setResult(null);

    setTool("pen");

    if (
      canvasRef.current
    ) {
      canvasRef.current.clear();
    }
  };


  // ==========================================================
  // DRAWING CHANGE
  // ==========================================================

  const handleDrawingChange =
    (strokes) => {
      setDrawingData(
        strokes || []
      );
    };


  // ==========================================================
  // CHARACTER PRONUNCIATION
  // ==========================================================

  const handleSpeakCharacter = () => {
    if (!character || !window.speechSynthesis) {
      return;
    }

    const info = getCharacterLearningInfo(
      language,
      getDisplayCharacter(character)
    );

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      getDisplayCharacter(character)
    );

    utterance.lang = info.speechLang;
    utterance.rate = 0.75;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };


  // ==========================================================
  // CLEAR
  // ==========================================================

  const handleClear = () => {

    if (
      canvasRef.current
    ) {
      canvasRef.current.clear();
    }

    setDrawingData([]);

    setResult(null);
  };


  // ==========================================================
  // RECOGNIZE
  // ==========================================================

  const handleRecognize =
    async () => {

      if (!character) {
        setResult({
          accuracy: "--",
          confidence: "--",
          recognized: "--",
          feedback:
            "Please select a character first.",
          isCorrect: false,
          topPredictions: [],

          strokeAnalysis: null,
        });

        return;
      }


      if (
        drawingData.length ===
        0
      ) {
        setResult({
          accuracy: "--",
          confidence: "--",
          recognized: "--",
          feedback:
            "Please draw the character before recognition.",
          isCorrect: false,
          topPredictions: [],
        });

        return;
      }


      const image =
        canvasRef.current?.getImage();


      if (!image) {
        setResult({
          accuracy: "--",
          confidence: "--",
          recognized: "--",
          feedback:
            "Unable to capture your handwriting.",
          isCorrect: false,
          topPredictions: [],
        });

        return;
      }


      setIsRecognizing(true);

      setResult(null);


      try {

        console.log(
          "SCRIPTLY RECOGNITION"
        );

        console.log(
          "Language:",
          language
        );

        console.log(
          "Model label:",
          character
        );

        console.log(
          "Display:",
          getDisplayCharacter(
            character
          )
        );


        const response =
          await fetch(
            "https://scripty-backend-zd0r.onrender.com/predict",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  language:
                    language,

                  character:
                    character,

                  image:
                    image,

                  strokes:
                    drawingData,
                }),
            }
          );


        const data =
          await response.json();


        console.log(
          "BACKEND RESPONSE:",
          data
        );


        if (
          !response.ok
        ) {
          throw new Error(
            data.message ||
              "Backend recognition failed."
          );
        }


        // ----------------------------------------------------
        // RECOGNIZED
        // ----------------------------------------------------

        const recognized =
          data.recognized ??
          data.predicted_character ??
          data.prediction ??
          data.character ??
          "--";


        // ----------------------------------------------------
        // CONFIDENCE
        // ----------------------------------------------------

        let confidence =
          data.confidence ??
          data.probability ??
          0;


        if (
          typeof confidence ===
            "number" &&
          confidence <= 1
        ) {
          confidence *= 100;
        }


        // ----------------------------------------------------
        // ACCURACY
        // ----------------------------------------------------

        let accuracy =
          data.accuracy ??
          confidence;


        if (
          typeof accuracy ===
            "number" &&
          accuracy <= 1
        ) {
          accuracy *= 100;
        }


        // ----------------------------------------------------
        // CORRECT
        // ----------------------------------------------------

        const isCorrect =
          data.is_correct ??
          data.correct ??
          data.target_match ??
          false;


        // ----------------------------------------------------
        // TOP PREDICTIONS
        // ----------------------------------------------------

        const rawPredictions =
          data.top_predictions ||
          data.topPredictions ||
          [];


        const topPredictions =
          rawPredictions.map(
            (
              prediction
            ) => {

              const predCharacter =
                prediction.character ??
                prediction.label ??
                prediction.class ??
                "--";


              let predConfidence =
                prediction.confidence ??
                prediction.probability ??
                0;


              if (
                typeof predConfidence ===
                  "number" &&
                predConfidence <= 1
              ) {
                predConfidence *=
                  100;
              }


              return {
                character:
                  predCharacter,

                confidence:
                  Number(
                    predConfidence
                  ).toFixed(1),
              };
            }
          );


        const strokeAnalysis =
          data.stroke_analysis ||
          data.strokeAnalysis ||
          null;

        const mistakeAnalysis =
          data.mistake_analysis ||
          data.mistakeAnalysis ||
          null;

        const feedback =
          data.feedback ||
          data.message ||
          "Handwriting analyzed successfully.";

        setResult({
          accuracy:
            typeof accuracy ===
            "number"
              ? `${accuracy.toFixed(
                  1
                )}%`
              : String(accuracy),

          confidence:
            typeof confidence ===
            "number"
              ? `${confidence.toFixed(
                  2
                )}%`
              : String(confidence),

          recognized,

          feedback,

          isCorrect:
            Boolean(
              isCorrect
            ),

          topPredictions,

          strokeAnalysis,

          mistakeAnalysis,
        });

        // ----------------------------------------------------
        // SAVE PRACTICE ATTEMPT
        // ----------------------------------------------------
        // Saving is separate from recognition so a database
        // problem never prevents the recognition result.
        try {
         const saveResponse = await fetch(
          "https://scripty-backend-zd0r.onrender.com/save-attempt",
          {
            method: "POST",
            
            credentials: "include",
            
            headers: {
              "Content-Type": "application/json",
            },
              body: JSON.stringify({
                language,
                character,
                recognized,
                confidence,
                accuracy,
                is_correct: Boolean(isCorrect),
                strokes: drawingData,
                stroke_analysis: strokeAnalysis,
                mistake_analysis: mistakeAnalysis,
                feedback,
              }),
            }
          );

          const saveData = await saveResponse.json();

          if (!saveResponse.ok) {
            console.warn(
              "Practice attempt was not saved:",
              saveData.message
            );
          } else {
            console.log(
              "Practice attempt saved:",
              saveData.attempt_id
            );
          }
        } catch (saveError) {
          console.warn(
            "Practice result saved locally, but database save failed:",
            saveError
          );
        }

      } catch (error) {

        console.error(
          "Recognition error:",
          error
        );

        setResult({
          accuracy: "--",
          confidence: "--",
          recognized: "--",

          feedback:
            error.message ||
            "Unable to connect to the handwriting backend.",

          isCorrect: false,

          topPredictions: [],
        });

      } finally {

        setIsRecognizing(
          false
        );
      }
    };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Page>

      {/* ====================================================
          NAVBAR
      ==================================================== */}

      <Navbar>

        <LogoLink to="/dashboard">

          <LogoImage
            src="/scriptly-logo.png"
            alt="SCRIPTLY"
          />

        </LogoLink>


        <NavLinks>

          <Link to="/dashboard">
            Dashboard
          </Link>

          <Active>
            Practice
          </Active>

          <Link to="/quiz">
            Quiz
          </Link>

          <Link to="/performance">
            Practice Performance
          </Link>

          <Link to="/quiz-performance">
            Quiz Performance
          </Link>

          <LogoutButton
            type="button"
            onClick={logout}
          >
            Logout
          </LogoutButton>

        </NavLinks>

      </Navbar>


      {/* ====================================================
          MAIN
      ==================================================== */}

      <Main>

        <Header>

          <HeaderText>

            <Label>
              HANDWRITING PRACTICE
            </Label>

            <Title>
              Practice{" "}
              <Gradient>
                every character.
              </Gradient>
            </Title>

            <Subtitle>
              Write the character shown
              below and let AI analyze
              your handwriting.
            </Subtitle>

          </HeaderText>


          {/* =================================================
              LANGUAGE SELECTOR
          ================================================= */}

          <LanguageSelector>

            {LANGUAGE_INFO.map(
              (item) => (

                <LanguageOption
                  key={item.name}
                  type="button"
                  $active={
                    language ===
                    item.name
                  }
                  onClick={() =>
                    handleLanguageChange(
                      item.name
                    )
                  }
                >

                  <LanguageShort>
                    {
                      item.short
                    }
                  </LanguageShort>


                  <LanguageDetails>

                    <LanguageCode>
                      {
                        item.code
                      }
                    </LanguageCode>

                    <LanguageName>
                      {
                        item.display
                      }
                    </LanguageName>

                  </LanguageDetails>


                  {language ===
                    item.name && (
                    <LanguageCheck>
                      ✓
                    </LanguageCheck>
                  )}

                </LanguageOption>

              )
            )}

          </LanguageSelector>

        </Header>


        {/* ==================================================
            CHARACTER CARD
        ================================================== */}

        <CharacterCard>

          <CharacterHeader>

            <CharacterHeaderLeft>

              <CharacterIcon>
                A
              </CharacterIcon>


              <CharacterHeaderText>

                <SmallLabel>
                  SELECT CHARACTER
                </SmallLabel>

                <SelectedLanguage>
                  {language}
                </SelectedLanguage>

              </CharacterHeaderText>

            </CharacterHeaderLeft>


            <CharacterCount>
              {
                currentCharacters.length
              }{" "}
              characters
            </CharacterCount>

          </CharacterHeader>


          {language ===
          "Hindi" ? (

            <>
              <GroupTitle>
                व्यंजन{" "}
                <GroupEnglish>
                  (Consonants)
                </GroupEnglish>
              </GroupTitle>


              <HindiCharacterGrid>

                {HINDI_CONSONANTS.map(
                  ([label, display]) => (

                    <CharacterButton
                      key={label}
                      type="button"
                      $active={
                        character ===
                        label
                      }
                      onClick={() =>
                        handleCharacterChange(
                          label
                        )
                      }
                    >
                      {display}
                    </CharacterButton>

                  )
                )}

              </HindiCharacterGrid>


              <GroupDivider />


              <GroupTitle>
                संयुक्त अक्षर{" "}
                <GroupEnglish>
                  (Common Combinations)
                </GroupEnglish>
              </GroupTitle>


              <HindiCharacterGrid>

                {HINDI_COMBINATIONS.map(
                  ([label, display]) => (

                    <CharacterButton
                      key={label}
                      type="button"
                      $active={
                        character ===
                        label
                      }
                      onClick={() =>
                        handleCharacterChange(
                          label
                        )
                      }
                    >
                      {display}
                    </CharacterButton>

                  )
                )}

              </HindiCharacterGrid>

            </>

          ) : (

            <>

              <GroupTitle>
                {language ===
                "Japanese"
                  ? "ひらがな"
                  : language ===
                    "Russian"
                  ? "Русский алфавит"
                  : "Characters"}
              </GroupTitle>


              {isLoadingCharacters &&
              language ===
                "Korean" ? (

                <LoadingText>
                  Loading characters...
                </LoadingText>

              ) : currentCharacters.length ===
                0 ? (

                <NoCharacters>
                  No characters are
                  available from the
                  backend for this
                  language.
                </NoCharacters>

              ) : (

                <CharacterList>

                  {currentCharacters.map(
                    (item, index) => (

                      <CharacterButton
                        key={`${item}-${index}`}
                        type="button"
                        $active={
                          character ===
                          item
                        }
                        onClick={() =>
                          handleCharacterChange(
                            item
                          )
                        }
                      >
                        {
                          getDisplayCharacter(
                            item
                          )
                        }
                      </CharacterButton>

                    )
                  )}

                </CharacterList>

              )}

            </>

          )}

        </CharacterCard>


        {/* ==================================================
            PRACTICE SECTION
        ================================================== */}

        <PracticeGrid>


          {/* =================================================
              CANVAS
          ================================================= */}

          <CanvasCard>

            <CanvasHeader>

              <TargetBox>

                <SmallLabel>
                  TARGET CHARACTER
                </SmallLabel>


                {/* Target is ALSO shown above */}
                {/* the canvas. */}

                <TargetCharacter>
                  {
                    getDisplayCharacter(
                      character
                    ) || "—"
                  }
                </TargetCharacter>

              </TargetBox>


              <ToolSelector>

                <ToolButton
                  type="button"
                  $active={
                    tool === "pen"
                  }
                  onClick={() =>
                    setTool("pen")
                  }
                >
                  ✎ Pen
                </ToolButton>


                <ToolButton
                  type="button"
                  $active={
                    tool === "eraser"
                  }
                  onClick={() =>
                    setTool(
                      "eraser"
                    )
                  }
                >
                  🧽 Eraser
                </ToolButton>

              </ToolSelector>

            </CanvasHeader>


            {/* =================================================
                TARGET IS NOW INSIDE CANVAS
            ================================================= */}

            <DrawingCanvas
              ref={canvasRef}
              character={
                getDisplayCharacter(
                  character
                )
              }
              tool={tool}
              language={language}
              onDrawingChange={
                handleDrawingChange
              }
            />


            <CanvasActions>

              <ClearButton
                type="button"
                onClick={
                  handleClear
                }
              >
                Clear
              </ClearButton>


              <PreviousButton
                type="button"
                onClick={handlePrevious}
                disabled={
                  isRecognizing ||
                  currentCharacters.length === 0
                }
              >
                ← Previous
              </PreviousButton>


              <NextButton
                type="button"
                onClick={handleNext}
                disabled={
                  isRecognizing ||
                  currentCharacters.length === 0
                }
              >
                Next →
              </NextButton>


              <RandomButton
                type="button"
                onClick={
                  handleRandom
                }
                disabled={
                  isRecognizing ||
                  currentCharacters.length ===
                    0
                }
              >
                ✦ Random
              </RandomButton>


              <RecognizeButton
                type="button"
                onClick={
                  handleRecognize
                }
                disabled={
                  isRecognizing ||
                  !character
                }
              >
                {isRecognizing
                  ? "✦ Analyzing..."
                  : "✦ Recognize Character"}
              </RecognizeButton>

            </CanvasActions>

          </CanvasCard>


          {/* =================================================
              AI ANALYSIS
          ================================================= */}

          <AnalysisCard>

            <SmallLabel>
              AI ANALYSIS
            </SmallLabel>


            <AnalysisTitle>
              Your result
            </AnalysisTitle>


            <ResultCircle>

              <span>
                {result
                  ? result.confidence
                  : "--"}
              </span>

              <small>
                Confidence
              </small>

            </ResultCircle>


            <ResultDivider />


            <ResultItem>

              <small>
                RECOGNIZED CHARACTER
              </small>

              <strong>
                {result
                  ? getDisplayCharacter(
                      result.recognized
                    )
                  : "--"}
              </strong>

            </ResultItem>


            <ResultItem>

              <small>
                TARGET MATCH
              </small>

              <Match
                $correct={
                  result
                    ? result.isCorrect
                    : null
                }
              >
                {result
                  ? result.isCorrect
                    ? "✓ Correct"
                    : "✕ Try Again"
                  : "--"}
              </Match>

            </ResultItem>


            <ResultItem>

              <small>
                CHARACTER ACCURACY
              </small>

              <strong>
                {result
                  ? result.accuracy
                  : "--"}
              </strong>

            </ResultItem>


            {result?.strokeAnalysis?.available && (

              <div
                style={{
                  marginTop: "18px",
                  padding: "16px",
                  borderRadius: "14px",
                  background: "rgba(124,58,237,0.07)",
                  border: "1px solid rgba(139,92,246,0.16)",
                }}
              >
                <small
                  style={{
                    display: "block",
                    marginBottom: "12px",
                    color: "#9b7ee7",
                    fontSize: "9px",
                    letterSpacing: "1.2px",
                    fontWeight: 700,
                  }}
                >
                  STROKE ANALYSIS
                </small>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "10px",
                  }}
                >
                  <div>
                    <strong>{result.strokeAnalysis.stroke_count ?? 0}</strong>
                    <div style={{ fontSize: "10px", color: "#8f849f", marginTop: "3px" }}>Strokes</div>
                  </div>

                  <div>
                    <strong>
                      {result.strokeAnalysis.consistency_score != null
                        ? `${Number(result.strokeAnalysis.consistency_score).toFixed(1)}%`
                        : "--"}
                    </strong>
                    <div style={{ fontSize: "10px", color: "#8f849f", marginTop: "3px" }}>Consistency</div>
                  </div>

                  <div>
                    <strong>
                      {result.strokeAnalysis.average_stroke_speed != null
                        ? Number(result.strokeAnalysis.average_stroke_speed).toFixed(1)
                        : "--"}
                    </strong>
                    <div style={{ fontSize: "10px", color: "#8f849f", marginTop: "3px" }}>Speed</div>
                  </div>
                </div>

                {Array.isArray(result.strokeAnalysis.directions) &&
                  result.strokeAnalysis.directions.length > 0 && (
                    <div style={{ marginTop: "14px" }}>
                      <small style={{ color: "#9b7ee7", fontSize: "9px", letterSpacing: "1px" }}>
                        DIRECTIONS
                      </small>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                        {result.strokeAnalysis.directions.map((direction, index) => (
                          <span
                            key={`${direction}-${index}`}
                            style={{
                              padding: "5px 8px",
                              borderRadius: "7px",
                              background: "rgba(255,255,255,0.05)",
                              color: "#b8aec5",
                              fontSize: "10px",
                            }}
                          >
                            {index + 1}. {typeof direction === "object" ? direction.direction : direction}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {Array.isArray(result.strokeAnalysis.directions) &&
                  result.strokeAnalysis.directions.length > 0 && (
                    <div
                      style={{
                        marginTop: "14px",
                        paddingTop: "12px",
                        borderTop: "1px solid rgba(139,92,246,0.12)",
                      }}
                    >
                      <small
                        style={{
                          color: "#9b7ee7",
                          fontSize: "9px",
                          letterSpacing: "1px",
                        }}
                      >
                        STROKE ORDER
                      </small>

                      <div
                        style={{
                          marginTop: "8px",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >
                        {result.strokeAnalysis.directions.map((item, index) => {
                          const direction =
                            typeof item === "object" && item !== null
                              ? item.direction
                              : item;

                          return (
                            <span
                              key={`order-${index}`}
                              style={{
                                padding: "5px 8px",
                                borderRadius: "7px",
                                background: "rgba(124,58,237,0.12)",
                                color: "#c4b5fd",
                                fontSize: "10px",
                              }}
                            >
                              {index + 1} → {direction || "unknown"}
                            </span>
                          );
                        })}
                      </div>

                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "10px",
                          color: "#8f849f",
                        }}
                      >
                        ✓ Stroke sequence captured from your handwriting
                      </div>
                    </div>
                  )}

                {result.strokeAnalysis.shape_analysis?.available && (
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(139,92,246,0.12)",
                    }}
                  >
                    <small
                      style={{
                        color: "#9b7ee7",
                        fontSize: "9px",
                        letterSpacing: "1px",
                      }}
                    >
                      CHARACTER SHAPE ANALYSIS
                    </small>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        marginTop: "10px",
                        fontSize: "10px",
                        color: "#8f849f",
                      }}
                    >
                      <span>Geometry score</span>
                      <strong style={{ color: "#a78bfa", textAlign: "right" }}>
                        {Number(result.strokeAnalysis.shape_analysis.geometry_score ?? 0).toFixed(1)}%
                      </strong>

                      <span>Shape quality</span>
                      <strong style={{ color: "#a78bfa", textAlign: "right" }}>
                        {result.strokeAnalysis.shape_analysis.shape_quality || "--"}
                      </strong>

                      <span>Aspect ratio</span>
                      <strong style={{ color: "#a78bfa", textAlign: "right" }}>
                        {Number(result.strokeAnalysis.shape_analysis.aspect_ratio ?? 0).toFixed(2)}
                      </strong>

                      <span>Centering</span>
                      <strong style={{ color: "#a78bfa", textAlign: "right" }}>
                        {Number(result.strokeAnalysis.shape_analysis.centering_score ?? 0).toFixed(1)}%
                      </strong>

                      <span>Canvas coverage</span>
                      <strong style={{ color: "#a78bfa", textAlign: "right" }}>
                        {Number(result.strokeAnalysis.shape_analysis.coverage_score ?? 0).toFixed(1)}%
                      </strong>
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "9px",
                        lineHeight: 1.5,
                        color: "#756b83",
                      }}
                    >
                      Based on handwriting geometry and canvas layout.
                    </div>
                  </div>
                )}

                {result.mistakeAnalysis?.available && (
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(139,92,246,0.12)",
                    }}
                  >
                    <small
                      style={{
                        color: "#9b7ee7",
                        fontSize: "9px",
                        letterSpacing: "1px",
                      }}
                    >
                      MISTAKE DETECTION
                    </small>

                    <div
                      style={{
                        marginTop: "9px",
                        fontSize: "11px",
                        color: "#b8aec5",
                        lineHeight: 1.55,
                      }}
                    >
                      {result.mistakeAnalysis.issue_count === 0 ? (
                        <div style={{ color: "#8ee6b1" }}>
                          ✓ No major handwriting issues detected
                        </div>
                      ) : (
                        <>
                          <div style={{ color: "#d7cbe5", marginBottom: "7px" }}>
                            {result.mistakeAnalysis.issue_count} issue{result.mistakeAnalysis.issue_count === 1 ? "" : "s"} detected
                          </div>

                          {Array.isArray(result.mistakeAnalysis.issues) &&
                            result.mistakeAnalysis.issues.map((issue, index) => (
                              <div
                                key={`${issue.type || "issue"}-${index}`}
                                style={{
                                  marginTop: "6px",
                                  padding: "7px 8px",
                                  borderRadius: "7px",
                                  background: "rgba(255,255,255,0.035)",
                                }}
                              >
                                <strong style={{ color: "#c4b5fd" }}>
                                  {issue.title || "Issue"}
                                </strong>
                                <div style={{ marginTop: "2px", color: "#8f849f", fontSize: "10px" }}>
                                  {issue.message || ""}
                                </div>
                              </div>
                            ))}
                        </>
                      )}
                    </div>

                    {Array.isArray(result.mistakeAnalysis.suggestions) &&
                      result.mistakeAnalysis.suggestions.length > 0 && (
                        <div style={{ marginTop: "9px" }}>
                          <small
                            style={{
                              color: "#9b7ee7",
                              fontSize: "9px",
                              letterSpacing: "1px",
                            }}
                          >
                            SUGGESTION
                          </small>
                          <div
                            style={{
                              marginTop: "5px",
                              fontSize: "10px",
                              color: "#8f849f",
                              lineHeight: 1.5,
                            }}
                          >
                            {result.mistakeAnalysis.suggestions[0]}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    marginTop: "14px",
                    fontSize: "10px",
                    color: "#8f849f",
                  }}
                >
                  <span>Writing time</span>
                  <strong style={{ color: "#a78bfa", textAlign: "right" }}>
                    {result.strokeAnalysis.writing_time_ms != null
                      ? `${Number(result.strokeAnalysis.writing_time_ms).toFixed(0)} ms`
                      : "--"}
                  </strong>

                  <span>Avg. stroke length</span>
                  <strong style={{ color: "#a78bfa", textAlign: "right" }}>
                    {result.strokeAnalysis.average_stroke_length != null
                      ? Number(result.strokeAnalysis.average_stroke_length).toFixed(1)
                      : "--"}
                  </strong>
                </div>
              </div>
            )}


            {result?.topPredictions
              ?.length > 0 && (

              <Predictions>

                <small>
                  TOP PREDICTIONS
                </small>


                {result.topPredictions.map(
                  (
                    prediction,
                    index
                  ) => (

                    <Prediction
                      key={`${prediction.character}-${index}`}
                    >

                      <span>
                        {
                          getDisplayCharacter(
                            prediction.character
                          )
                        }
                      </span>


                      <strong>
                        {
                          prediction.confidence
                        }%
                      </strong>

                    </Prediction>

                  )
                )}

              </Predictions>

            )}


            <Feedback>

              <FeedbackIcon>
                ✦
              </FeedbackIcon>


              <FeedbackText>

                <small>
                  AI FEEDBACK
                </small>


                <p>
                  {result
                    ? result.feedback
                    : 'Draw the character and click "Recognize Character" to receive AI feedback.'}
                </p>

              </FeedbackText>

            </Feedback>

          </AnalysisCard>

        </PracticeGrid>


        {/* =================================================
            CHARACTER LEARNING CARD
        ================================================= */}

        <LearningCard>
          <LearningHeader>
            <div>
              <SmallLabel>CHARACTER LEARNING</SmallLabel>
              <LearningTitle>
                {getDisplayCharacter(character) || "—"}
              </LearningTitle>
            </div>

            <SpeakButton
              type="button"
              onClick={handleSpeakCharacter}
              disabled={!character}
            >
              🔊 Listen
            </SpeakButton>
          </LearningHeader>

          <LearningGrid>
            <LearningItem>
              <LearningIcon>🔤</LearningIcon>
              <div>
                <LearningLabel>PRONUNCIATION</LearningLabel>
                <LearningValue>
                  {character
                    ? getCharacterLearningInfo(language, getDisplayCharacter(character)).pronunciation
                    : "—"}
                </LearningValue>
              </div>
            </LearningItem>

            <LearningItem>
              <LearningIcon>🌐</LearningIcon>
              <div>
                <LearningLabel>SCRIPT</LearningLabel>
                <LearningValue>
                  {character
                    ? getCharacterLearningInfo(language, getDisplayCharacter(character)).script
                    : "—"}
                </LearningValue>
              </div>
            </LearningItem>
          </LearningGrid>

          <LearningTip>
            <span>✦</span>
            <div>
              <LearningLabel>PRACTICE TIP</LearningLabel>
              <p>
                {character
                  ? getCharacterLearningInfo(language, getDisplayCharacter(character)).tip
                  : "Select a character to see a practice tip."}
              </p>
            </div>
          </LearningTip>
        </LearningCard>


        <Tip>

          <TipIcon>
            ⓘ
          </TipIcon>

          Make sure your handwriting
          is clear and centered for
          the best results.

        </Tip>

      </Main>

    </Page>
  );
}


// ============================================================
// STYLES
// ============================================================

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
  background: rgba(11, 7, 24, 0.96);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
`;


const LogoLink = styled(Link)`
  display: inline-flex;

  align-items: center;

  text-decoration: none;
`;


const LogoImage = styled.img`
  width: 185px;

  height: auto;

  display: block;
`;


const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 30px;
  margin-left: auto;

  a,
  button {
    color: #91899f;
    font-family: inherit;
    font-size: 13px;
    font-weight: 400;
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.2s ease;
  }

  a:hover,
  button:hover {
    color: #ffffff;
  }

  @media (max-width: 1050px) {
    gap: 18px;
    overflow-x: auto;
    padding-left: 20px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  @media (max-width: 700px) {
    gap: 14px;

    a,
    button {
      font-size: 12px;
    }
  }
`;

const LogoutButton = styled.button`
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
`;


const Active = styled.span`
  color: #b99cff;
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
`;


const Main = styled.main`
  width:
    min(
      1200px,
      90%
    );

  margin: auto;

  padding:
    45px 0 70px;
`;


const Header = styled.div`
  display: flex;

  justify-content: space-between;

  align-items: flex-end;

  gap: 35px;

  @media (max-width: 1050px) {
    flex-direction: column;

    align-items: flex-start;
  }
`;


const HeaderText = styled.div`
  max-width: 570px;
`;


const Label = styled.div`
  color: #a77bff;

  font-size: 10px;

  font-weight: 700;

  letter-spacing: 2px;
`;


const SmallLabel = styled.div`
  color: #776b8d;

  font-size: 8px;

  letter-spacing: 1.5px;

  font-weight: 600;
`;


const Title = styled.h1`
  font-size:
    clamp(
      38px,
      5vw,
      50px
    );

  letter-spacing: -2px;

  margin: 9px 0;
`;


const Gradient = styled.span`
  background:
    linear-gradient(
      90deg,
      #a78bfa,
      #e9d5ff
    );

  -webkit-background-clip:
    text;

  -webkit-text-fill-color:
    transparent;
`;


const Subtitle = styled.p`
  color: #91899f;

  font-size: 14px;

  max-width: 570px;

  line-height: 1.7;

  margin: 0;
`;


// ============================================================
// LANGUAGE SELECTOR
// ============================================================

const LanguageSelector = styled.div`
  display: grid;

  grid-template-columns:
    repeat(
      5,
      minmax(
        100px,
        1fr
      )
    );

  gap: 5px;

  width: 100%;

  max-width: 680px;

  padding: 5px;

  border-radius: 15px;

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
      0.08
    );

  @media (max-width: 900px) {
    grid-template-columns:
      repeat(
        3,
        1fr
      );
  }

  @media (max-width: 550px) {
    grid-template-columns:
      repeat(
        2,
        1fr
      );
  }
`;


const LanguageOption = styled.button`
  position: relative;

  min-height: 60px;

  padding:
    8px 10px;

  border-radius: 11px;

  border:
    1px solid
    ${(props) =>
      props.$active
        ? "rgba(167,123,255,0.65)"
        : "transparent"};

  background:
    ${(props) =>
      props.$active
        ? "rgba(124,58,237,0.18)"
        : "transparent"};

  display: flex;

  align-items: center;

  gap: 9px;

  text-align: left;

  color: white;

  cursor: pointer;

  transition: 0.2s ease;

  &:hover {
    background:
      rgba(
        124,
        58,
        237,
        0.12
      );

    border-color:
      rgba(
        167,
        123,
        255,
        0.35
      );
  }
`;


const LanguageShort = styled.span`
  color: #f7f3ff;

  font-size: 14px;

  font-weight: 800;

  min-width: 25px;
`;


const LanguageDetails = styled.div`
  display: flex;

  flex-direction: column;

  gap: 2px;

  min-width: 0;
`;


const LanguageCode = styled.span`
  color: #786e8b;

  font-size: 7px;

  letter-spacing: 1.4px;

  font-weight: 700;
`;


const LanguageName = styled.span`
  color: #f7f3ff;

  font-size: 12px;

  font-weight: 700;

  white-space: nowrap;
`;


const LanguageCheck = styled.span`
  margin-left: auto;

  color: #b99cff;

  font-size: 18px;

  font-weight: 800;
`;


// ============================================================
// CHARACTER CARD
// ============================================================

const CharacterCard = styled.section`
  margin-top: 32px;

  padding: 24px;

  border-radius: 18px;

  background:
    rgba(
      255,
      255,
      255,
      0.035
    );

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.09
    );
`;


const CharacterHeader = styled.div`
  display: flex;

  align-items: center;

  justify-content: space-between;
`;


const CharacterHeaderLeft = styled.div`
  display: flex;

  align-items: center;

  gap: 12px;
`;


const CharacterHeaderText = styled.div`
  display: flex;

  flex-direction: column;

  gap: 4px;
`;


const CharacterIcon = styled.span`
  width: 34px;

  height: 34px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 9px;

  border:
    1px solid
    rgba(
      167,
      123,
      255,
      0.45
    );

  background:
    rgba(
      124,
      58,
      237,
      0.12
    );

  color: #b28aff;

  font-size: 16px;

  font-weight: 800;
`;


const SelectedLanguage = styled.div`
  color: #b99cff;

  font-size: 12px;

  font-weight: 800;

  letter-spacing: 1.5px;

  text-transform: uppercase;
`;


const CharacterCount = styled.span`
  color: #776b8d;

  font-size: 11px;
`;


const GroupTitle = styled.h3`
  color: #c4a5ff;

  font-size: 17px;

  margin:
    24px 0 14px;

  font-family:
    "Noto Sans Devanagari",
    "Noto Sans",
    sans-serif;
`;


const GroupEnglish = styled.span`
  color: #887d99;

  font-size: 11px;

  font-weight: 400;
`;


const HindiCharacterGrid = styled.div`
  display: grid;

  grid-template-columns:
    repeat(
      10,
      58px
    );

  gap: 9px;

  @media (max-width: 850px) {
    grid-template-columns:
      repeat(
        8,
        58px
      );
  }

  @media (max-width: 650px) {
    grid-template-columns:
      repeat(
        5,
        58px
      );
  }
`;


const CharacterList = styled.div`
  display: grid;

  grid-template-columns:
    repeat(
      auto-fill,
      minmax(
        58px,
        1fr
      )
    );

  gap: 9px;

  margin-top: 14px;

  max-height: 230px;

  overflow-y: auto;

  padding-right: 5px;
`;


const CharacterButton = styled.button`
  width: 100%;

  height: 50px;

  border-radius: 10px;

  border:
    1px solid
    ${(props) =>
      props.$active
        ? "#9a72f0"
        : "rgba(255,255,255,0.10)"};

  background:
    ${(props) =>
      props.$active
        ? "rgba(124,58,237,0.23)"
        : "rgba(255,255,255,0.025)"};

  color: #f7f3ff;

  font-size: 25px;

  font-family:
    "Noto Sans CJK JP",
    "Noto Sans JP",
    "Noto Sans KR",
    "Malgun Gothic",
    "Noto Sans Devanagari",
    "Mangal",
    "Noto Sans",
    sans-serif;

  cursor: pointer;

  display: flex;

  align-items: center;

  justify-content: center;

  transition:
    all 0.18s ease;

  &:hover {
    border-color: #a477ff;

    background:
      rgba(
        124,
        58,
        237,
        0.14
      );
  }
`;


const GroupDivider = styled.div`
  height: 1px;

  margin:
    23px 0;

  background:
    rgba(
      255,
      255,
      255,
      0.07
    );
`;


const LoadingText = styled.div`
  margin-top: 15px;

  padding: 18px;

  color: #81798f;

  font-size: 12px;
`;


const NoCharacters = styled.div`
  margin-top: 14px;

  padding: 16px;

  color: #c18c8c;

  font-size: 12px;
`;


// ============================================================
// PRACTICE GRID
// ============================================================

const PracticeGrid = styled.div`
  display: grid;

  grid-template-columns:
    minmax(
      0,
      1.5fr
    )
    minmax(
      320px,
      0.8fr
    );

  gap: 20px;

  margin-top: 20px;

  @media (max-width: 950px) {
    grid-template-columns:
      1fr;
  }
`;


const CanvasCard = styled.div`
  min-width: 0;

  padding: 24px;

  border-radius: 18px;

  background:
    rgba(
      255,
      255,
      255,
      0.035
    );

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.09
    );
`;


const CanvasHeader = styled.div`
  display: flex;

  justify-content:
    space-between;

  align-items: center;

  gap: 20px;

  margin-bottom: 15px;
`;


const TargetBox = styled.div`
  display: flex;

  align-items: center;

  gap: 16px;
`;


const TargetCharacter = styled.div`
  font-size: 40px;

  line-height: 1;

  font-family:
    "Noto Sans CJK JP",
    "Noto Sans JP",
    "Noto Sans KR",
    "Malgun Gothic",
    "Noto Sans Devanagari",
    "Mangal",
    "Noto Sans",
    sans-serif;

  color: white;
`;


const ToolSelector = styled.div`
  display: flex;

  gap: 4px;

  padding: 4px;

  border-radius: 11px;

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
      0.08
    );
`;


const ToolButton = styled.button`
  min-width: 76px;

  height: 36px;

  padding:
    0 12px;

  border-radius: 8px;

  border:
    1px solid
    ${(props) =>
      props.$active
        ? "#8e67d9"
        : "transparent"};

  background:
    ${(props) =>
      props.$active
        ? "rgba(124,58,237,0.20)"
        : "transparent"};

  color:
    ${(props) =>
      props.$active
        ? "#ffffff"
        : "#958b9f"};

  font-size: 12px;

  cursor: pointer;

  &:hover {
    color: white;
  }
`;


const CanvasActions = styled.div`
  display: grid;

  grid-template-columns:
    auto
    auto
    auto
    minmax(
      180px,
      1fr
    );

  gap: 10px;

  margin-top: 18px;

  @media (max-width: 650px) {
    grid-template-columns:
      1fr 1fr;
  }
`;


const ClearButton = styled.button`
  min-height: 44px;

  padding:
    0 20px;

  border-radius: 9px;

  background: transparent;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.10
    );

  color: #aaa0b3;

  font-size: 13px;

  cursor: pointer;
`;


const PreviousButton = styled.button`
  min-height: 44px;
  padding: 0 20px;
  border-radius: 9px;
  background: rgba(124, 58, 237, 0.10);
  border: 1px solid rgba(139, 92, 246, 0.38);
  color: #c7b4f3;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;


const NextButton = styled.button`
  min-height: 44px;

  padding:
    0 20px;

  border-radius: 9px;

  background:
    rgba(
      124,
      58,
      237,
      0.10
    );

  border:
    1px solid
    rgba(
      139,
      92,
      246,
      0.38
    );

  color: #c7b4f3;

  font-size: 13px;

  font-weight: 600;

  cursor: pointer;

  &:disabled {
    opacity: 0.5;

    cursor: not-allowed;
  }
`;


const RandomButton = styled.button`
  min-height: 44px;

  padding:
    0 20px;

  border-radius: 9px;

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
      0.10
    );

  color: #cfc6dc;

  font-size: 13px;

  font-weight: 600;

  cursor: pointer;

  &:disabled {
    opacity: 0.5;

    cursor: not-allowed;
  }
`;


const RecognizeButton = styled.button`
  min-height: 44px;

  padding:
    0 22px;

  border: none;

  border-radius: 9px;

  background:
    linear-gradient(
      135deg,
      #925df4,
      #8140e8
    );

  color: white;

  font-size: 13px;

  font-weight: 700;

  cursor: pointer;

  &:disabled {
    opacity: 0.6;

    cursor: not-allowed;
  }
`;


// ============================================================
// ANALYSIS
// ============================================================

const AnalysisCard = styled.div`
  min-width: 0;

  padding: 25px;

  border-radius: 18px;

  background:
    rgba(
      255,
      255,
      255,
      0.035
    );

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.09
    );
`;


const AnalysisTitle = styled.h2`
  font-size: 27px;

  margin:
    7px 0 25px;
`;


const ResultCircle = styled.div`
  width: 150px;

  height: 150px;

  margin: 0 auto;

  border-radius: 50%;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  border:
    1px solid
    rgba(
      163,
      125,
      235,
      0.5
    );

  box-shadow:
    inset 0 0 0 7px
    rgba(
      124,
      58,
      237,
      0.08
    );

  span {
    font-size: 28px;

    font-weight: 800;

    color: #b99cff;
  }

  small {
    margin-top: 6px;

    color: #766d82;

    font-size: 8px;
  }
`;


const ResultDivider = styled.div`
  height: 1px;

  margin:
    27px 0 14px;

  background:
    rgba(
      255,
      255,
      255,
      0.07
    );
`;


const ResultItem = styled.div`
  padding:
    12px 0;

  small {
    display: block;

    color: #70677e;

    font-size: 8px;

    letter-spacing: 1px;
  }

  strong {
    display: block;

    margin-top: 5px;

    color: #d7d0df;

    font-size: 21px;

    font-family:
      "Noto Sans CJK JP",
      "Noto Sans JP",
      "Noto Sans KR",
      "Malgun Gothic",
      "Noto Sans Devanagari",
      "Mangal",
      "Noto Sans",
      sans-serif;
  }
`;


const Match = styled.strong`
  color:
    ${(props) =>
      props.$correct === true
        ? "#9fe2b3"
        : props.$correct === false
        ? "#e99a9a"
        : "#d7d0df"} !important;

  font-size:
    16px !important;
`;


const Predictions = styled.div`
  margin-top: 15px;

  padding-top: 15px;

  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      0.06
    );

  > small {
    color: #70677e;

    font-size: 8px;

    letter-spacing: 1px;
  }
`;


const Prediction = styled.div`
  display: flex;

  justify-content:
    space-between;

  padding:
    7px 0;

  color: #aaa1b5;

  font-size: 20px;

  strong {
    color: #a78bfa;

    font-size: 11px;
  }
`;


const Feedback = styled.div`
  display: flex;

  gap: 12px;

  margin-top: 20px;

  padding: 15px;

  border-radius: 12px;

  background:
    rgba(
      124,
      58,
      237,
      0.08
    );

  border:
    1px solid
    rgba(
      139,
      92,
      246,
      0.15
    );
`;


const FeedbackIcon = styled.div`
  color: #a78bfa;

  font-size: 18px;
`;


const FeedbackText = styled.div`
  min-width: 0;

  small {
    color: #9b7ee7;

    font-size: 8px;

    letter-spacing: 1px;
  }

  p {
    color: #898091;

    font-size: 11px;

    line-height: 1.6;

    margin:
      5px 0 0;
  }
`;


const LearningCard = styled.div`
  margin-top: 20px;
  padding: 22px 24px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.09);
`;

const LearningHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
`;

const LearningTitle = styled.div`
  margin-top: 4px;
  color: #f4efff;
  font-size: 34px;
  font-weight: 600;
`;

const SpeakButton = styled.button`
  border: 1px solid rgba(167, 139, 250, 0.28);
  border-radius: 10px;
  padding: 9px 13px;
  background: rgba(124, 58, 237, 0.1);
  color: #c4b5fd;
  font-size: 11px;
  cursor: pointer;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const LearningGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
  @media (max-width: 650px) { grid-template-columns: 1fr; }
`;

const LearningItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  border-radius: 12px;
  background: rgba(124, 58, 237, 0.07);
  border: 1px solid rgba(139, 92, 246, 0.12);
`;

const LearningIcon = styled.span`font-size: 18px;`;

const LearningLabel = styled.div`
  color: #9b7ee7;
  font-size: 8px;
  letter-spacing: 1px;
`;

const LearningValue = styled.div`
  margin-top: 4px;
  color: #d8d0e2;
  font-size: 13px;
`;

const LearningTip = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 14px;
  padding: 13px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.06);
  span { color: #a78bfa; }
  p { margin: 4px 0 0; color: #898091; font-size: 11px; line-height: 1.55; }
`;


const Tip = styled.div`
  display: flex;

  align-items: center;

  gap: 10px;

  margin-top: 20px;

  color: #8f849f;

  font-size: 12px;
`;


const TipIcon = styled.span`
  color: #a78bfa;

  font-size: 17px;
`;


export default Practice;