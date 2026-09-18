import { useEffect, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";


/* =====================================================
   LIVE PRACTICE DATA
===================================================== */

const practiceSamples = [

  /* ================= ENGLISH ================= */

  {
    character: "A",
    language: "English",
    accuracy: "98.2%",
  },

  {
    character: "B",
    language: "English",
    accuracy: "94.6%",
  },

  {
    character: "C",
    language: "English",
    accuracy: "96.4%",
  },


  /* ================= HINDI ================= */

  {
    character: "अ",
    language: "Hindi",
    accuracy: "92.8%",
  },

  {
    character: "आ",
    language: "Hindi",
    accuracy: "95.1%",
  },

  {
    character: "क",
    language: "Hindi",
    accuracy: "91.7%",
  },


  /* ================= JAPANESE ================= */

  {
    character: "あ",
    language: "Japanese",
    accuracy: "96.8%",
  },

  {
    character: "い",
    language: "Japanese",
    accuracy: "94.3%",
  },

  {
    character: "う",
    language: "Japanese",
    accuracy: "97.1%",
  },


  /* ================= KOREAN ================= */

  {
    character: "가",
    language: "Korean",
    accuracy: "93.5%",
  },

  {
    character: "나",
    language: "Korean",
    accuracy: "95.7%",
  },

  {
    character: "다",
    language: "Korean",
    accuracy: "91.9%",
  },


  /* ================= RUSSIAN ================= */

  {
    character: "А",
    language: "Russian",
    accuracy: "97.4%",
  },

  {
    character: "Б",
    language: "Russian",
    accuracy: "94.9%",
  },

  {
    character: "В",
    language: "Russian",
    accuracy: "96.1%",
  },

];


/* =====================================================
   HOME
===================================================== */

function Home() {


  /* =====================================================
     LANGUAGES
  ===================================================== */

  const languages = [

    {
      icon: "🇬🇧",
      name: "English",
      native: "English",
      text: "Practice English handwriting",
    },

    {
      icon: "🇮🇳",
      name: "Hindi",
      native: "हिंदी",
      text: "Practice Hindi handwriting",
    },

    {
      icon: "🇯🇵",
      name: "Japanese",
      native: "日本語",
      text: "Practice Japanese handwriting",
    },

    {
      icon: "🇰🇷",
      name: "Korean",
      native: "한국어",
      text: "Practice Korean handwriting",
    },

    {
      icon: "🇷🇺",
      name: "Russian",
      native: "Русский",
      text: "Practice Russian handwriting",
    },

  ];


  /* =====================================================
     LIVE CHARACTER INDEX
  ===================================================== */

  const [sampleIndex, setSampleIndex] =
    useState(0);


  /* =====================================================
     AUTOMATIC CHARACTER CHANGE
  ===================================================== */

  useEffect(() => {

    const interval = setInterval(() => {

      setSampleIndex((current) => {

        return (
          (current + 1) %
          practiceSamples.length
        );

      });

    }, 2200);


    return () => {

      clearInterval(interval);

    };

  }, []);


  /* =====================================================
     CURRENT SAMPLE
  ===================================================== */

  const currentSample =
    practiceSamples[sampleIndex];


  /* =====================================================
     RETURN
  ===================================================== */

  return (

    <Page>

      <Navbar />


      {/* =================================================
          HERO
      ================================================= */}

      <Hero id="home">

        <Glow />


        {/* =================================================
            LEFT CONTENT
        ================================================= */}

        <HeroLeft>

          <Badge>

            ✦ AI POWERED HANDWRITING LEARNING

          </Badge>


          <Title>

            Learn Languages.

            <br />

            <Gradient>

              Improve Every Stroke.

            </Gradient>

          </Title>


          <Description>

            Practice handwriting in English, Hindi,
            Japanese, Korean and Russian with
            AI-powered character recognition,
            stroke tracking, accuracy analysis
            and personalized feedback.

          </Description>


          {/* =================================================
              BUTTONS
          ================================================= */}

          <Buttons>

            <PrimaryButton
              as={Link}
              to="/practice?language=English"
            >

              Start Practicing →

            </PrimaryButton>


            <SecondaryButton
              as="a"
              href="#features"
            >

              Explore Features

            </SecondaryButton>

          </Buttons>


          {/* =================================================
              STATS
          ================================================= */}

          <Stats>

            <Stat>

              <strong>
                5
              </strong>

              <span>
                Languages
              </span>

            </Stat>


            <Line />


            <Stat>

              <strong>
                AI
              </strong>

              <span>
                Powered
              </span>

            </Stat>


            <Line />


            <Stat>

              <strong>
                ∞
              </strong>

              <span>
                Practice
              </span>

            </Stat>

          </Stats>

        </HeroLeft>


        {/* =================================================
            LIVE PRACTICE PREVIEW
        ================================================= */}

        <Preview>


          {/* =================================================
              PREVIEW HEADER
          ================================================= */}

          <PreviewHeader>

            <div>

              <Small>
                LIVE PRACTICE
              </Small>

              <PreviewTitle>
                Write & Learn
              </PreviewTitle>

            </div>


            <Ready>

              <Circle />

              AI READY

            </Ready>

          </PreviewHeader>


          {/* =================================================
              CANVAS
          ================================================= */}

          <Canvas>

            <Written
              key={sampleIndex}
            >

              {currentSample.character}

            </Written>

          </Canvas>


          {/* =================================================
              RESULT
          ================================================= */}

          <Result>

            <div>

              <ResultLabel>

                RECOGNIZED CHARACTER

              </ResultLabel>


              <ResultCharacter>

                {currentSample.character}

              </ResultCharacter>

            </div>


            <Accuracy>

              <ResultLabel>

                ACCURACY

              </ResultLabel>


              <AccuracyValue>

                {currentSample.accuracy}

              </AccuracyValue>

            </Accuracy>

          </Result>


          {/* =================================================
              LANGUAGE
          ================================================= */}

          <PreviewLanguage>

            {currentSample.language}

          </PreviewLanguage>

        </Preview>

      </Hero>


      {/* =====================================================
          LANGUAGES
      ===================================================== */}

      <Section id="languages">

        <SectionLabel>

          CHOOSE YOUR LANGUAGE

        </SectionLabel>


        <SectionTitle>

          Practice in{" "}

          <Gradient>

            your language.

          </Gradient>

        </SectionTitle>


        <LanguageGrid>

          {languages.map((language) => (

            <LanguageCard

              key={language.name}

              as={Link}

              to={`/practice?language=${encodeURIComponent(
                language.name
              )}`}

            >

              <LanguageIcon>

                {language.icon}

              </LanguageIcon>


              <LanguageInfo>

                <h3>

                  {language.native}

                </h3>


                <p>

                  {language.text}

                </p>

              </LanguageInfo>


              <Arrow>

                →

              </Arrow>

            </LanguageCard>

          ))}

        </LanguageGrid>

      </Section>


      {/* =====================================================
          FEATURES
      ===================================================== */}

      <Section id="features">

        <SectionLabel>

          POWERFUL LEARNING TOOLS

        </SectionLabel>


        <SectionTitle>

          More than handwriting

          <br />

          <Gradient>

            recognition.

          </Gradient>

        </SectionTitle>


        <FeatureGrid>


          {/* ================= STROKE ================= */}

          <FeatureCard>

            <FeatureIcon>
              ✍
            </FeatureIcon>

            <h3>
              Stroke Tracking
            </h3>

            <p>

              Track stroke order and writing
              movement while practicing
              characters.

            </p>

          </FeatureCard>


          {/* ================= ACCURACY ================= */}

          <FeatureCard>

            <FeatureIcon>
              🎯
            </FeatureIcon>

            <h3>
              Better Accuracy
            </h3>

            <p>

              Get character recognition
              with confidence and accuracy
              scores.

            </p>

          </FeatureCard>


          {/* ================= AI ================= */}

          <FeatureCard>

            <FeatureIcon>
              🤖
            </FeatureIcon>

            <h3>
              AI Feedback
            </h3>

            <p>

              Receive personalized suggestions
              to improve your handwriting.

            </p>

          </FeatureCard>


          {/* ================= PERFORMANCE ================= */}

          <FeatureCard>

            <FeatureIcon>
              📊
            </FeatureIcon>

            <h3>
              Performance Analysis
            </h3>

            <p>

              Track language-wise and
              character-wise learning progress.

            </p>

          </FeatureCard>


        </FeatureGrid>

      </Section>


      {/* =====================================================
          ABOUT
      ===================================================== */}

      <About id="about">

        <SectionLabel>

          ABOUT THE PLATFORM

        </SectionLabel>


        <AboutTitle>

          Write.{" "}

          <Gradient>
            Learn.
          </Gradient>{" "}

          Improve.

        </AboutTitle>


        <AboutText>

          Scriptly is an AI-based handwriting
          learning platform designed to help
          users practice and improve handwriting
          across multiple languages through
          intelligent character recognition,
          stroke analysis, accuracy measurement
          and personalized feedback.

        </AboutText>

      </About>


    </Page>

  );

}


/* =====================================================
   PAGE
===================================================== */

const Page = styled.div`

  min-height: 100vh;

  background:

    radial-gradient(
      circle at 85% 20%,
      rgba(124, 58, 237, 0.28),
      transparent 30%
    ),

    radial-gradient(
      circle at 10% 45%,
      rgba(91, 33, 182, 0.18),
      transparent 28%
    ),

    #0b0718;

  color: white;

`;


/* =====================================================
   HERO
===================================================== */

const Hero = styled.section`

  min-height: 780px;

  padding:
    150px
    7%
    80px;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 70px;

  position: relative;

  overflow: hidden;


  @media (max-width: 900px) {

    flex-direction: column;

    padding-top: 130px;

  }

`;


/* =====================================================
   GLOW
===================================================== */

const Glow = styled.div`

  position: absolute;

  width: 450px;

  height: 450px;

  left: 32%;

  top: 20%;

  background: #7c3aed;

  opacity: 0.12;

  filter: blur(130px);

  pointer-events: none;

`;


/* =====================================================
   HERO LEFT
===================================================== */

const HeroLeft = styled.div`

  max-width: 650px;

  position: relative;

  z-index: 2;

`;


/* =====================================================
   BADGE
===================================================== */

const Badge = styled.div`

  display: inline-block;

  padding:
    9px
    16px;

  border-radius: 30px;

  border:
    1px solid
    rgba(167,139,250,0.35);

  background:
    rgba(124,58,237,0.12);

  color: #b99cff;

  font-size: 10px;

  font-weight: 700;

  letter-spacing: 1.5px;

  margin-bottom: 24px;

`;


/* =====================================================
   TITLE
===================================================== */

const Title = styled.h1`

  font-size:
    clamp(
      48px,
      6vw,
      76px
    );

  line-height: 1.02;

  letter-spacing: -3px;

  margin-bottom: 25px;

`;


/* =====================================================
   GRADIENT
===================================================== */

const Gradient = styled.span`

  background:
    linear-gradient(
      90deg,
      #a78bfa,
      #e9d5ff
    );

  -webkit-background-clip: text;

  -webkit-text-fill-color: transparent;

`;


/* =====================================================
   DESCRIPTION
===================================================== */

const Description = styled.p`

  max-width: 570px;

  color: #aaa2bd;

  font-size: 17px;

  line-height: 1.7;

`;


/* =====================================================
   BUTTONS
===================================================== */

const Buttons = styled.div`

  display: flex;

  gap: 14px;

  margin-top: 32px;

  flex-wrap: wrap;

`;


/* =====================================================
   PRIMARY BUTTON
===================================================== */

const PrimaryButton = styled.button`

  border: none;

  background:
    linear-gradient(
      135deg,
      #8b5cf6,
      #7c3aed
    );

  color: white;

  padding:
    15px
    24px;

  border-radius: 11px;

  font-weight: 700;

  cursor: pointer;

  text-decoration: none;

  display: inline-block;

  transition: 0.2s;


  &:hover {

    transform:
      translateY(-2px);

    box-shadow:
      0 8px 25px
      rgba(124,58,237,0.25);

  }

`;


/* =====================================================
   SECONDARY BUTTON
===================================================== */

const SecondaryButton = styled.button`

  background:
    rgba(255,255,255,0.04);

  border:
    1px solid
    rgba(255,255,255,0.12);

  color: white;

  padding:
    15px
    24px;

  border-radius: 11px;

  cursor: pointer;

  text-decoration: none;

  display: inline-block;

  transition: 0.2s;


  &:hover {

    background:
      rgba(255,255,255,0.08);

  }

`;


/* =====================================================
   STATS
===================================================== */

const Stats = styled.div`

  display: flex;

  align-items: center;

  gap: 25px;

  margin-top: 45px;

`;


const Stat = styled.div`

  display: flex;

  flex-direction: column;


  strong {

    font-size: 23px;

  }


  span {

    color: #888198;

    font-size: 12px;

    margin-top: 4px;

  }

`;


const Line = styled.div`

  width: 1px;

  height: 35px;

  background:
    rgba(255,255,255,0.12);

`;


/* =====================================================
   PREVIEW CARD
===================================================== */

const Preview = styled.div`

  width: 390px;

  padding: 22px;

  background:
    rgba(255,255,255,0.055);

  border:
    1px solid
    rgba(255,255,255,0.12);

  border-radius: 24px;

  backdrop-filter: blur(15px);

  position: relative;

  z-index: 2;

  overflow: hidden;


  @media (max-width: 900px) {

    width:
      min(
        390px,
        100%
      );

  }

`;


/* =====================================================
   PREVIEW HEADER
===================================================== */

const PreviewHeader = styled.div`

  display: flex;

  justify-content: space-between;

  align-items: center;

`;


const Small = styled.div`

  color: #8e7ba9;

  font-size: 9px;

  letter-spacing: 2px;

`;


const PreviewTitle = styled.h3`

  margin-top: 5px;

  font-size: 18px;

`;


/* =====================================================
   AI READY
===================================================== */

const Ready = styled.div`

  color: #bca5ff;

  font-size: 9px;

  font-weight: 700;

  display: flex;

  align-items: center;

  gap: 5px;

`;


const Circle = styled.span`

  width: 6px;

  height: 6px;

  border-radius: 50%;

  background: #a78bfa;

  box-shadow:
    0 0 10px
    rgba(167,139,250,0.8);

`;


/* =====================================================
   CANVAS
===================================================== */

const Canvas = styled.div`

  height: 270px;

  margin-top: 20px;

  border-radius: 16px;

  position: relative;

  display: flex;

  align-items: center;

  justify-content: center;

  overflow: hidden;

  background-color: #110c27;

  /*
     ONLY GRID LINES
     NO DIAGONAL LINES
  */

  background-image:

    linear-gradient(
      rgba(255,255,255,0.025) 1px,
      transparent 1px
    ),

    linear-gradient(
      90deg,
      rgba(255,255,255,0.025) 1px,
      transparent 1px
    );

  background-size:
    30px 30px;

  border:
    1px solid
    rgba(255,255,255,0.08);

  /*
     IMPORTANT:
     Disable pseudo-elements
  */

  &::before,
  &::after {

    content: none !important;

    display: none !important;

  }

`;


/* =====================================================
   CENTERED CHARACTER
===================================================== */

const Written = styled.div`

  position: absolute;

  left: 50%;

  top: 50%;

  /*
     EXACT CENTER
  */

  transform:
    translate(-50%, -50%);

  width: 100%;

  height: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

  text-align: center;

  color: #ddd1ff;

  font-size: 145px;

  font-family: serif;

  font-weight: 500;

  line-height: 1;

  z-index: 2;

  white-space: nowrap;

  pointer-events: none;

  text-shadow:
    0 0 10px
    rgba(167,139,250,0.18);

  animation:
    characterChange
    0.6s
    ease;


  /*
     Character transition
  */

  @keyframes characterChange {

    0% {

      opacity: 0;

      transform:
        translate(-50%, -50%)
        scale(0.85);

    }


    100% {

      opacity: 1;

      transform:
        translate(-50%, -50%)
        scale(1);

    }

  }

`;


/* =====================================================
   RESULT
===================================================== */

const Result = styled.div`

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  margin-top: 18px;

`;


const ResultLabel = styled.span`

  display: block;

  color: #8e849f;

  font-size: 9px;

  letter-spacing: 1px;

`;


const ResultCharacter = styled.strong`

  display: block;

  font-size: 21px;

  margin-top: 4px;

`;


const Accuracy = styled.div`

  text-align: right;

`;


const AccuracyValue = styled.strong`

  display: block;

  color: #b9a0ff;

  font-size: 22px;

  margin-top: 4px;

`;


/* =====================================================
   PREVIEW LANGUAGE
===================================================== */

const PreviewLanguage = styled.div`

  color: #766b89;

  font-size: 8px;

  letter-spacing: 1.5px;

  text-align: center;

  margin-top: 14px;

  text-transform: uppercase;

`;


/* =====================================================
   SECTION
===================================================== */

const Section = styled.section`

  padding:
    100px
    7%;

  background:
    rgba(255,255,255,0.018);

`;


/* =====================================================
   SECTION LABEL
===================================================== */

const SectionLabel = styled.div`

  color: #9676e8;

  font-size: 10px;

  letter-spacing: 2px;

  font-weight: 700;

`;


/* =====================================================
   SECTION TITLE
===================================================== */

const SectionTitle = styled.h2`

  font-size: 42px;

  line-height: 1.1;

  margin-top: 12px;

`;


/* =====================================================
   LANGUAGE GRID
===================================================== */

const LanguageGrid = styled.div`

  display: grid;

  grid-template-columns:
    repeat(
      3,
      1fr
    );

  gap: 18px;

  margin-top: 45px;


  @media (max-width: 1000px) {

    grid-template-columns:
      repeat(
        2,
        1fr
      );

  }


  @media (max-width: 650px) {

    grid-template-columns:
      1fr;

  }

`;


/* =====================================================
   LANGUAGE CARD
===================================================== */

const LanguageCard = styled.div`

  padding: 25px;

  border-radius: 18px;

  border:
    1px solid
    rgba(255,255,255,0.09);

  background:
    rgba(255,255,255,0.035);

  display: flex;

  align-items: center;

  gap: 18px;

  cursor: pointer;

  text-decoration: none;

  color: white;

  transition: 0.3s;


  &:hover {

    transform:
      translateY(-4px);

    border-color:
      rgba(167,139,250,0.45);

    background:
      rgba(255,255,255,0.06);

  }

`;


const LanguageIcon = styled.div`

  font-size: 32px;

`;


const LanguageInfo = styled.div`

  flex: 1;


  h3 {

    font-size: 19px;

  }


  p {

    color: #888198;

    font-size: 12px;

    margin-top: 5px;

  }

`;


const Arrow = styled.div`

  color: #a78bfa;

  font-size: 20px;

`;


/* =====================================================
   FEATURE GRID
===================================================== */

const FeatureGrid = styled.div`

  display: grid;

  grid-template-columns:
    repeat(
      4,
      1fr
    );

  gap: 18px;

  margin-top: 50px;


  @media (max-width: 1000px) {

    grid-template-columns:
      repeat(
        2,
        1fr
      );

  }


  @media (max-width: 600px) {

    grid-template-columns:
      1fr;

  }

`;


/* =====================================================
   FEATURE CARD
===================================================== */

const FeatureCard = styled.div`

  padding: 28px;

  min-height: 205px;

  border-radius: 18px;

  background:
    rgba(255,255,255,0.035);

  border:
    1px solid
    rgba(255,255,255,0.08);

  transition: 0.3s;


  &:hover {

    transform:
      translateY(-4px);

    border-color:
      rgba(167,139,250,0.35);

  }


  h3 {

    margin-top: 24px;

    font-size: 17px;

  }


  p {

    color: #8f879e;

    font-size: 13px;

    line-height: 1.6;

    margin-top: 10px;

  }

`;


const FeatureIcon = styled.div`

  font-size: 25px;

`;


/* =====================================================
   ABOUT
===================================================== */

const About = styled.section`

  padding:
    110px
    7%;

  text-align: center;

`;


const AboutTitle = styled.h2`

  font-size: 45px;

  margin-top: 15px;

`;


const AboutText = styled.p`

  max-width: 700px;

  margin:
    20px
    auto
    0;

  color: #91899f;

  line-height: 1.7;

`;


/* =====================================================
   EXPORT
===================================================== */

export default Home;