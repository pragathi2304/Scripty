import { useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";

import PhoneInputPackage from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const PhoneInput =
  PhoneInputPackage.default || PhoneInputPackage;

const API = "/api";


function Register() {
  const navigate = useNavigate();

  /* =====================================================
     FORM STATE
  ===================================================== */

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [country, setCountry] =
    useState("in");


  /* =====================================================
     COMMON STATE
  ===================================================== */

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);


  /* =====================================================
     REGISTER
  ===================================================== */

  const handleRegister = async (event) => {
    event.preventDefault();

    setMessage("");
    setSuccess(false);


    /* ===============================================
       BASIC VALIDATION
    =============================================== */

    if (!name.trim()) {
      setMessage("Please enter your full name.");
      return;
    }


    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email.trim())) {
      setMessage(
        "Please enter a valid email address."
      );
      return;
    }


    const phoneDigits =
      phone.replace(/\D/g, "");


    if (phoneDigits.length < 8) {
      setMessage(
        "Please enter a valid phone number."
      );
      return;
    }


    if (!password) {
      setMessage(
        "Please enter a password."
      );
      return;
    }


    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      );
      return;
    }


    if (!confirmPassword) {
      setMessage(
        "Please confirm your password."
      );
      return;
    }


    if (password !== confirmPassword) {
      setMessage(
        "Passwords do not match."
      );
      return;
    }


    /* ===============================================
       START REQUEST
    =============================================== */

    setLoading(true);


    try {

      /* =============================================
         REGISTER USER
      ============================================= */

      const response = await fetch(
        `${API}/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: name.trim(),

            email: email
              .trim()
              .toLowerCase(),

            phone: phone,

            password: password,
          }),
        }
      );


      const data =
        await response.json();


      console.log(
        "REGISTER BACKEND RESPONSE:",
        data
      );


      /* =============================================
         ERROR
      ============================================= */

      if (!response.ok) {

        setMessage(
          data.message ||
          "Registration failed."
        );

        return;
      }


      /* =============================================
         REGISTRATION SUCCESS
         
         Backend currently creates the session
         after registration. We immediately logout
         that session because the required flow is:

         REGISTER
            ↓
         SUCCESS
            ↓
         LOGIN
            ↓
         DASHBOARD
      ============================================= */

      localStorage.removeItem(
        "scriptlyUser"
      );


      try {

        await fetch(
          `${API}/auth/logout`,
          {
            method: "POST",
            credentials: "include",
          }
        );

      } catch (logoutError) {

        console.warn(
          "Registration session cleanup:",
          logoutError
        );

      }


      setSuccess(true);

      setMessage(
        "Registration successful! Redirecting to login..."
      );


      /* =============================================
         REDIRECT TO LOGIN
      ============================================= */

      setTimeout(() => {

        navigate(
          "/login",
          {
            replace: true,
          }
        );

      }, 1800);


    } catch (error) {

      console.error(
        "Registration error:",
        error
      );


      setMessage(
        "Unable to connect to backend. Make sure Flask is running."
      );


    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     UI
  ===================================================== */

  return (

    <Page>


      {/* =================================================
          LEFT SIDE
      ================================================= */}

      <LeftPanel>


        {/* LOGO */}

        <LogoLink to="/">

          <LogoImage
            src="/scriptly-logo.png"
            alt="SCRIPTLY"
          />

        </LogoLink>


        {/* LEFT CONTENT */}

        <LeftContent>


          <SmallLabel>
            AI HANDWRITING LEARNING
          </SmallLabel>


          <Heading>

            Start your
            <Gradient>
              handwriting journey.
            </Gradient>

          </Heading>


          <Description>

            Create your Scriptly account and
            practice handwriting in English,
            Hindi, Japanese, Korean and Russian
            with intelligent recognition and
            personalized feedback.

          </Description>


          {/* FEATURES */}

          <Features>


            <Feature>

              <FeatureIcon>
                ✦
              </FeatureIcon>

              <div>

                <FeatureTitle>
                  PERSONALIZED PROGRESS
                </FeatureTitle>

                <FeatureText>
                  Your progress starts at 0% and
                  grows from your actual practice.
                </FeatureText>

              </div>

            </Feature>


            <Feature>

              <FeatureIcon>
                ✦
              </FeatureIcon>

              <div>

                <FeatureTitle>
                  CHARACTER ANALYSIS
                </FeatureTitle>

                <FeatureText>
                  Track accuracy and improvement
                  for every character.
                </FeatureText>

              </div>

            </Feature>


            <Feature>

              <FeatureIcon>
                ✦
              </FeatureIcon>

              <div>

                <FeatureTitle>
                  AI FEEDBACK
                </FeatureTitle>

                <FeatureText>
                  Receive intelligent suggestions
                  while you practice.
                </FeatureText>

              </div>

            </Feature>


          </Features>


        </LeftContent>


      </LeftPanel>


      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <RightPanel>


        {/* BACK TO HOME */}

        <BackLink to="/">

          <BackIcon>
            ←
          </BackIcon>

          BACK TO HOME

        </BackLink>


        {/* FORM */}

        <FormContainer>


          <FormHeader>

            <Title>
              Create Account
            </Title>


            <Subtitle>

              Already have an account?{" "}

              <LoginLink to="/login">
                Login
              </LoginLink>

            </Subtitle>

          </FormHeader>


          <Form
            onSubmit={handleRegister}
          >


            {/* =================================================
                NAME
            ================================================= */}

            <Field>

              <Label>
                FULL NAME
              </Label>


              <InputWrapper>

                <InputIcon>
                  ◉
                </InputIcon>


                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  autoComplete="name"
                />

              </InputWrapper>

            </Field>


            {/* =================================================
                EMAIL
            ================================================= */}

            <Field>

              <Label>
                EMAIL ADDRESS
              </Label>


              <InputWrapper>

                <InputIcon>
                  ✉
                </InputIcon>


                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  autoComplete="email"
                />

              </InputWrapper>

            </Field>


            {/* =================================================
                PHONE
            ================================================= */}

            <Field>

              <Label>
                PHONE NUMBER
              </Label>


              <PhoneWrapper>

                <PhoneInput

                  country={country}

                  value={phone}

                  onChange={(
                    value,
                    countryData
                  ) => {

                    setPhone(value);


                    if (
                      countryData?.countryCode
                    ) {

                      setCountry(
                        countryData.countryCode
                      );

                    }

                  }}

                  enableSearch

                  searchPlaceholder="Search country..."

                  countryCodeEditable={false}

                  preferredCountries={[
                    "in",
                    "us",
                    "gb",
                    "jp",
                    "kr",
                    "ru",
                    "ae",
                    "ca",
                    "au",
                  ]}

                  placeholder="Enter phone number"

                  disabled={loading}

                />

              </PhoneWrapper>

            </Field>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <Field>

              <Label>
                PASSWORD
              </Label>


              <InputWrapper>

                <InputIcon>
                  🔒
                </InputIcon>


                <Input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  autoComplete="new-password"
                />


                <ShowPassword
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword
                    ? "◉"
                    : "◌"}

                </ShowPassword>

              </InputWrapper>


              <PasswordHint>

                Minimum 6 characters

              </PasswordHint>

            </Field>


            {/* =================================================
                CONFIRM PASSWORD
            ================================================= */}

            <Field>

              <Label>
                CONFIRM PASSWORD
              </Label>


              <InputWrapper>

                <InputIcon>
                  🔒
                </InputIcon>


                <Input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  disabled={loading}
                  autoComplete="new-password"
                />


                <ShowPassword
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showConfirmPassword
                    ? "◉"
                    : "◌"}

                </ShowPassword>

              </InputWrapper>


              {confirmPassword &&
                password ===
                  confirmPassword && (

                  <PasswordMatch>
                    ✓ Passwords match
                  </PasswordMatch>

                )}

            </Field>


            {/* =================================================
                REGISTER BUTTON
            ================================================= */}

            <RegisterButton
              type="submit"
              disabled={loading}
            >

              {loading
                ? "CREATING ACCOUNT..."
                : "CREATE ACCOUNT"}

            </RegisterButton>


          </Form>


          {/* =================================================
              MESSAGE
          ================================================= */}

          {message && (

            <Message $success={success}>

              <MessageIcon>
                {success
                  ? "✓"
                  : "!"}
              </MessageIcon>


              <MessageText>
                {message}
              </MessageText>

            </Message>

          )}


        </FormContainer>


      </RightPanel>


    </Page>

  );
}


/* =====================================================
   PAGE
===================================================== */

const Page = styled.div`

  min-height: 100vh;

  display: grid;

  grid-template-columns:
    1fr 1fr;

  background:
    #08061a;

  color:
    white;


  @media (max-width: 850px) {

    grid-template-columns:
      1fr;

  }

`;


/* =====================================================
   LEFT PANEL
===================================================== */

const LeftPanel = styled.section`

  min-height: 100vh;

  padding:
    45px 8%;

  position: relative;

  overflow: hidden;

  background:

    radial-gradient(
      circle at 30% 35%,
      rgba(
        124,
        58,
        237,
        0.24
      ),
      transparent 40%
    ),

    linear-gradient(
      135deg,
      #171039,
      #0d0925
    );


  &::after {

    content: "";

    position: absolute;

    width:
      500px;

    height:
      500px;

    right:
      -250px;

    bottom:
      -250px;

    border-radius:
      50%;

    background:
      rgba(
        139,
        92,
        246,
        0.08
      );

    filter:
      blur(80px);

    pointer-events:
      none;

  }


  @media (max-width: 850px) {

    min-height:
      auto;

    padding:
      30px 7%;

  }

`;


/* =====================================================
   LOGO
===================================================== */

const LogoLink = styled(Link)`

  display:
    inline-flex;

  text-decoration:
    none;

`;


const LogoImage = styled.img`

  width:
    150px;

  height:
    auto;

  display:
    block;

  object-fit:
    contain;

`;


/* =====================================================
   LEFT CONTENT
===================================================== */

const LeftContent = styled.div`

  position:
    relative;

  z-index:
    2;

  max-width:
    620px;

  margin-top:
    105px;


  @media (max-width: 850px) {

    margin-top:
      60px;

  }

`;


const SmallLabel = styled.div`

  color:
    #9b7bea;

  font-size:
    9px;

  font-weight:
    700;

  letter-spacing:
    2px;

`;


const Heading = styled.h1`

  margin:
    14px 0;

  font-size:
    clamp(
      42px,
      5vw,
      68px
    );

  line-height:
    1.02;

  letter-spacing:
    -3px;

  font-weight:
    800;

`;


const Gradient = styled.span`

  display:
    block;

  background:
    linear-gradient(
      90deg,
      #a78bfa,
      #7c3aed,
      #d8b4fe
    );

  -webkit-background-clip:
    text;

  -webkit-text-fill-color:
    transparent;

  filter:
    drop-shadow(
      0 0 20px
      rgba(
        139,
        92,
        246,
        0.3
      )
    );

`;


const Description = styled.p`

  max-width:
    520px;

  color:
    #aaa2bd;

  font-size:
    16px;

  line-height:
    1.8;

  margin-top:
    25px;

`;


/* =====================================================
   FEATURES
===================================================== */

const Features = styled.div`

  display:
    flex;

  flex-direction:
    column;

  gap:
    25px;

  margin-top:
    75px;

`;


const Feature = styled.div`

  display:
    flex;

  align-items:
    center;

  gap:
    15px;

`;


const FeatureIcon = styled.div`

  width:
    45px;

  height:
    45px;

  flex-shrink:
    0;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  border-radius:
    12px;

  color:
    #a78bfa;

  background:
    rgba(
      139,
      92,
      246,
      0.08
    );

  border:
    1px solid
    rgba(
      167,
      139,
      250,
      0.18
    );

  font-size:
    18px;

`;


const FeatureTitle = styled.div`

  color:
    #bcb4ca;

  font-size:
    10px;

  font-weight:
    700;

  letter-spacing:
    1.5px;

`;


const FeatureText = styled.div`

  color:
    #70687e;

  font-size:
    11px;

  margin-top:
    5px;

`;


/* =====================================================
   RIGHT PANEL
===================================================== */

const RightPanel = styled.section`

  min-height:
    100vh;

  padding:
    35px 9%;

  background:

    radial-gradient(
      circle at 80% 10%,
      rgba(
        124,
        58,
        237,
        0.07
      ),
      transparent 30%
    ),

    #08091a;


  @media (max-width: 850px) {

    min-height:
      auto;

    padding:
      35px 7% 70px;

  }

`;


/* =====================================================
   BACK LINK
===================================================== */

const BackLink = styled(Link)`

  display:
    inline-flex;

  align-items:
    center;

  gap:
    10px;

  color:
    #aaa2b8;

  text-decoration:
    none;

  font-size:
    10px;

  font-weight:
    700;

  letter-spacing:
    1.5px;


  &:hover {

    color:
      white;

  }

`;


const BackIcon = styled.span`

  width:
    40px;

  height:
    40px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  border-radius:
    10px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.1
    );

  background:
    rgba(
      255,
      255,
      255,
      0.03
    );

  font-size:
    20px;

`;


/* =====================================================
   FORM CONTAINER
===================================================== */

const FormContainer = styled.div`

  width:
    100%;

  max-width:
    540px;

  margin:
    55px auto 0;

`;


/* =====================================================
   HEADER
===================================================== */

const FormHeader = styled.div`

  margin-bottom:
    38px;

`;


const Title = styled.h2`

  margin:
    0;

  font-size:
    clamp(
      34px,
      4vw,
      46px
    );

  letter-spacing:
    -2px;

  font-weight:
    800;

`;


const Subtitle = styled.p`

  margin-top:
    12px;

  color:
    #aaa3b7;

  font-size:
    15px;

  line-height:
    1.7;

`;


const LoginLink = styled(Link)`

  color:
    #9b6cff;

  font-weight:
    700;

  text-decoration:
    none;


  &:hover {

    color:
      #b99cff;

    text-decoration:
      underline;

  }

`;


/* =====================================================
   FORM
===================================================== */

const Form = styled.form`

  display:
    flex;

  flex-direction:
    column;

  gap:
    25px;

`;


const Field = styled.div`

  width:
    100%;

`;


const Label = styled.label`

  display:
    block;

  color:
    #777083;

  font-size:
    9px;

  font-weight:
    700;

  letter-spacing:
    2px;

  margin-bottom:
    12px;

`;


/* =====================================================
   INPUT
===================================================== */

const InputWrapper = styled.div`

  height:
    65px;

  display:
    flex;

  align-items:
    center;

  gap:
    14px;

  padding:
    0 18px;

  border-radius:
    15px;

  background:
    #171727;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  transition:
    0.25s;


  &:focus-within {

    border-color:
      #8b5cf6;

    box-shadow:
      0 0 0 3px
      rgba(
        139,
        92,
        246,
        0.08
      );

  }

`;


const InputIcon = styled.span`

  color:
    #888096;

  font-size:
    18px;

  width:
    22px;

  text-align:
    center;

  flex-shrink:
    0;

`;


const Input = styled.input`

  flex:
    1;

  width:
    100%;

  height:
    100%;

  border:
    none;

  outline:
    none;

  background:
    transparent;

  color:
    white;

  font-size:
    15px;

  min-width:
    0;


  &::placeholder {

    color:
      #777286;

  }


  &:disabled {

    opacity:
      0.6;

  }

`;


/* =====================================================
   PASSWORD BUTTON
===================================================== */

const ShowPassword = styled.button`

  border:
    none;

  background:
    transparent;

  color:
    #81798f;

  cursor:
    pointer;

  font-size:
    18px;

  padding:
    5px;

  flex-shrink:
    0;


  &:hover:not(:disabled) {

    color:
      white;

  }


  &:disabled {

    cursor:
      not-allowed;

    opacity:
      0.5;

  }

`;


/* =====================================================
   PASSWORD HINT
===================================================== */

const PasswordHint = styled.div`

  margin-top:
    7px;

  color:
    #625b6d;

  font-size:
    10px;

`;


const PasswordMatch = styled.div`

  margin-top:
    7px;

  color:
    #9f8cff;

  font-size:
    10px;

`;


/* =====================================================
   PHONE
===================================================== */

const PhoneWrapper = styled.div`

  width:
    100%;

  height:
    65px;

  border-radius:
    15px;

  background:
    #171727;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  transition:
    0.25s;


  &:focus-within {

    border-color:
      #8b5cf6;

    box-shadow:
      0 0 0 3px
      rgba(
        139,
        92,
        246,
        0.08
      );

  }


  .react-tel-input {

    width:
      100%;

    height:
      100%;

  }


  .form-control {

    width:
      100% !important;

    height:
      63px !important;

    background:
      transparent !important;

    border:
      none !important;

    color:
      white !important;

    font-size:
      15px !important;

    padding-left:
      62px !important;

    border-radius:
      15px !important;

    outline:
      none !important;

  }


  .form-control::placeholder {

    color:
      #777286 !important;

  }


  .flag-dropdown {

    background:
      transparent !important;

    border:
      none !important;

    border-radius:
      15px 0 0 15px !important;

  }


  .selected-flag {

    width:
      52px !important;

    height:
      63px !important;

    background:
      transparent !important;

    border-radius:
      15px 0 0 15px !important;

  }


  .selected-flag:hover,
  .selected-flag:focus {

    background:
      rgba(
        255,
        255,
        255,
        0.04
      ) !important;

  }


  .country-list {

    width:
      300px !important;

    background:
      #171727 !important;

    color:
      white !important;

    border:
      1px solid
      rgba(
        255,
        255,
        255,
        0.1
      ) !important;

    box-shadow:
      0 10px 30px
      rgba(
        0,
        0,
        0,
        0.5
      ) !important;

  }


  .country-list .country {

    color:
      #d4cedd !important;

    padding:
      10px 12px !important;

  }


  .country-list .country:hover {

    background:
      rgba(
        139,
        92,
        246,
        0.15
      ) !important;

  }


  .country-list .country.highlight {

    background:
      rgba(
        139,
        92,
        246,
        0.2
      ) !important;

  }


  .country-list .search {

    background:
      #171727 !important;

    color:
      white !important;

    border:
      1px solid
      rgba(
        255,
        255,
        255,
        0.1
      ) !important;

    margin:
      10px !important;

    width:
      calc(100% - 20px) !important;

  }


  .country-list .search-box {

    background:
      #171727 !important;

    color:
      white !important;

  }


  .country-list .dial-code {

    color:
      #9b7bea !important;

  }

`;


/* =====================================================
   REGISTER BUTTON
===================================================== */

const RegisterButton = styled.button`

  height:
    65px;

  border:
    none;

  border-radius:
    12px;

  background:
    linear-gradient(
      100deg,
      #8b5cf6,
      #a78bfa
    );

  color:
    white;

  font-size:
    12px;

  font-weight:
    800;

  letter-spacing:
    3px;

  cursor:
    pointer;

  margin-top:
    8px;

  transition:
    0.25s;

  box-shadow:
    0 10px 30px
    rgba(
      124,
      58,
      237,
      0.2
    );


  &:hover:not(:disabled) {

    transform:
      translateY(-2px);

    box-shadow:
      0 14px 35px
      rgba(
        124,
        58,
        237,
        0.3
      );

  }


  &:active:not(:disabled) {

    transform:
      translateY(0);

  }


  &:disabled {

    opacity:
      0.6;

    cursor:
      not-allowed;

  }

`;


/* =====================================================
   MESSAGE
===================================================== */

const Message = styled.div`

  display:
    flex;

  align-items:
    center;

  gap:
    12px;

  padding:
    14px 16px;

  border-radius:
    11px;

  background:
    ${(props) =>
      props.$success
        ? "rgba(139, 92, 246, 0.12)"
        : "rgba(139, 92, 246, 0.08)"};

  border:
    1px solid
    ${(props) =>
      props.$success
        ? "rgba(167, 139, 250, 0.35)"
        : "rgba(139, 92, 246, 0.2)"};

  color:
    #bca6ff;

  font-size:
    11px;

  line-height:
    1.5;

  margin-top:
    20px;

`;


const MessageIcon = styled.div`

  width:
    24px;

  height:
    24px;

  flex-shrink:
    0;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  border-radius:
    50%;

  background:
    rgba(
      139,
      92,
      246,
      0.18
    );

  color:
    #c4a7ff;

  font-weight:
    800;

`;


const MessageText = styled.div`

  flex:
    1;

`;


export default Register;