import { useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";

import PhoneInputPackage from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const PhoneInput =
  PhoneInputPackage.default || PhoneInputPackage;

const API = "https://scripty-backend-zd0r.onrender.com";


function Login() {
  const navigate = useNavigate();

  /* =====================================================
     LOGIN MODE
  ===================================================== */

  const [loginMode, setLoginMode] = useState("password");


  /* =====================================================
     PASSWORD LOGIN
  ===================================================== */

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  /* =====================================================
     OTP LOGIN
  ===================================================== */

  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("in");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);


  /* =====================================================
     COMMON
  ===================================================== */

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  /* =====================================================
     PASSWORD LOGIN
  ===================================================== */

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "LOGIN BACKEND RESPONSE:",
        data
      );

      if (!response.ok) {
        setMessage(
          data.message || "Login failed."
        );
        return;
      }


      /* =================================================
         SAVE USER
      ================================================= */

      if (data.user) {
        localStorage.setItem(
          "scriptlyUser",
          JSON.stringify(data.user)
        );
      }


      /* =================================================
         LOGIN SUCCESS
      ================================================= */

      setMessage(
        "Login successful! Redirecting..."
      );


      /* =================================================
         DASHBOARD
      ================================================= */

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);

    } catch (error) {

      console.error(
        "Login error:",
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
     SEND OTP
  ===================================================== */

  const handleSendOTP = async (event) => {
    event.preventDefault();
    setMessage("");

    const phoneDigits =
      phone.replace(/\D/g, "");


    if (phoneDigits.length < 8) {

      setMessage(
        "Please enter a valid phone number."
      );

      return;
    }


    setLoading(true);


    try {

      const response = await fetch(
        `${API}/send-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            phone: phone,
          }),
        }
      );


      const data =
        await response.json();


      console.log(
        "SEND OTP RESPONSE:",
        data
      );


      if (!response.ok) {

        setMessage(
          data.message ||
          "Unable to send OTP."
        );

        return;
      }


      /* =================================================
         DEVELOPMENT OTP
      ================================================= */

      if (data.otp) {

        setMessage(
          `OTP sent successfully. Demo OTP: ${data.otp}`
        );

      } else {

        setMessage(
          "OTP sent successfully. Check your phone."
        );

      }


      setOtpSent(true);

    } catch (error) {

      console.error(
        "OTP error:",
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
     VERIFY OTP
  ===================================================== */

  const handleVerifyOTP = async (event) => {
    event.preventDefault();
    setMessage("");


    if (!/^\d{6}$/.test(otp)) {

      setMessage(
        "Please enter the 6-digit OTP."
      );

      return;
    }


    setLoading(true);


    try {

      const response = await fetch(
        `${API}/verify-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            phone: phone,
            otp: otp,
          }),
        }
      );


      const data =
        await response.json();


      console.log(
        "VERIFY OTP RESPONSE:",
        data
      );


      if (!response.ok) {

        setMessage(
          data.message ||
          "Invalid OTP."
        );

        return;
      }


      /* =================================================
         SAVE USER
      ================================================= */

      if (data.user) {

        localStorage.setItem(
          "scriptlyUser",
          JSON.stringify(data.user)
        );

      }


      /* =================================================
         LOGIN SUCCESS
      ================================================= */

      setMessage(
        "Login successful! Redirecting..."
      );


      /* =================================================
         DASHBOARD
      ================================================= */

      setTimeout(() => {

        navigate("/dashboard");

      }, 500);


    } catch (error) {

      console.error(
        "Verification error:",
        error
      );

      setMessage(
        "Unable to connect to backend."
      );

    } finally {

      setLoading(false);

    }
  };


  /* =====================================================
     CHANGE PHONE NUMBER
  ===================================================== */

  const handleChangeNumber = () => {

    setOtpSent(false);

    setOtp("");

    setMessage("");

  };


  /* =====================================================
     SWITCH LOGIN MODE
  ===================================================== */

  const switchMode = (mode) => {

    setLoginMode(mode);

    setMessage("");

    setOtpSent(false);

    setOtp("");

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

            Write.

            <Gradient>
              Learn. Improve.
            </Gradient>

          </Heading>


          <Description>

            Practice handwriting in English,
            Hindi, Japanese, Korean and Russian
            with intelligent character recognition,
            stroke tracking and personalized
            feedback.

          </Description>


          {/* FEATURES */}

          <Features>


            <Feature>

              <FeatureIcon>
                ✦
              </FeatureIcon>

              <div>

                <FeatureTitle>
                  STROKE TRACKING
                </FeatureTitle>

                <FeatureText>
                  Track every stroke while you write.
                </FeatureText>

              </div>

            </Feature>


            <Feature>

              <FeatureIcon>
                ✦
              </FeatureIcon>

              <div>

                <FeatureTitle>
                  CHARACTER RECOGNITION
                </FeatureTitle>

                <FeatureText>
                  Analyze handwritten characters across five languages.
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
                  Get suggestions to improve your writing.
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


        {/* BACK */}

        <BackLink to="/">

          <BackIcon>
            ←
          </BackIcon>

          BACK TO HOME

        </BackLink>


        <FormContainer>


          {!otpSent ? (

            <>


              {/* HEADER */}

              <FormHeader>

                <Title>
                  Welcome Back
                </Title>


                <Subtitle>

                  Don't have an account?{" "}

                  <CreateLink to="/register">
                    Create Account
                  </CreateLink>

                </Subtitle>

              </FormHeader>


              {/* LOGIN TABS */}

              <LoginTabs>


                <LoginTab
                  type="button"
                  $active={
                    loginMode === "password"
                  }
                  onClick={() =>
                    switchMode("password")
                  }
                >

                  PASSWORD LOGIN

                </LoginTab>


                <LoginTab
                  type="button"
                  $active={
                    loginMode === "otp"
                  }
                  onClick={() =>
                    switchMode("otp")
                  }
                >

                  OTP LOGIN

                </LoginTab>


              </LoginTabs>


              {/* =================================================
                  PASSWORD LOGIN
              ================================================= */}

              {loginMode === "password" && (

                <Form
                  onSubmit={
                    handlePasswordLogin
                  }
                >


                  {/* EMAIL */}

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
                        autoComplete="email"
                        onChange={(event) =>
                          setEmail(
                            event.target.value
                          )
                        }
                      />

                    </InputWrapper>

                  </Field>


                  {/* PASSWORD */}

                  <Field>

                    <PasswordHeader>

                      <Label>
                        PASSWORD
                      </Label>


                      <ForgotLink
                        to="/forgot-password"
                      >
                        FORGOT PASSWORD?
                      </ForgotLink>

                    </PasswordHeader>


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
                        placeholder="Password"
                        value={password}
                        autoComplete="current-password"
                        onChange={(event) =>
                          setPassword(
                            event.target.value
                          )
                        }
                      />


                      <ShowPassword
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
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

                  </Field>


                  {/* LOGIN */}

                  <LoginButton
                    type="submit"
                    disabled={loading}
                  >

                    {loading
                      ? "LOGGING IN..."
                      : "LOGIN"}

                  </LoginButton>


                </Form>

              )}


              {/* =================================================
                  OTP LOGIN
              ================================================= */}

              {loginMode === "otp" && (

                <Form
                  onSubmit={
                    handleSendOTP
                  }
                >


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
                      />

                    </PhoneWrapper>

                  </Field>


                  <LoginButton
                    type="submit"
                    disabled={loading}
                  >

                    {loading
                      ? "SENDING OTP..."
                      : "SEND OTP"}

                  </LoginButton>


                </Form>

              )}


              {/* MESSAGE */}

              {message && (

                <Message>
                  {message}
                </Message>

              )}


            </>

          ) : (


            /* =================================================
               OTP VERIFICATION
            ================================================= */

            <>


              <FormHeader>

                <Title>
                  Verify Phone
                </Title>


                <Subtitle>

                  Enter the 6-digit OTP sent to

                  <br />

                  <PhoneText>
                    +{phone}
                  </PhoneText>

                </Subtitle>

              </FormHeader>


              <Form
                onSubmit={
                  handleVerifyOTP
                }
              >


                {/* OTP */}

                <Field>

                  <Label>
                    VERIFICATION CODE
                  </Label>


                  <InputWrapper>

                    <InputIcon>
                      #
                    </InputIcon>


                    <OTPInput
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(event) =>
                        setOtp(
                          event.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                    />

                  </InputWrapper>

                </Field>


                {/* VERIFY */}

                <LoginButton
                  type="submit"
                  disabled={loading}
                >

                  {loading
                    ? "VERIFYING..."
                    : "VERIFY OTP"}

                </LoginButton>


                {/* CHANGE NUMBER */}

                <ChangeNumber
                  type="button"
                  onClick={
                    handleChangeNumber
                  }
                >

                  ← Change Phone Number

                </ChangeNumber>


                {/* MESSAGE */}

                {message && (

                  <Message>
                    {message}
                  </Message>

                )}


              </Form>


            </>

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

  background: #08061a;

  color: white;


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

    width: 500px;

    height: 500px;

    right: -250px;

    bottom: -250px;

    border-radius: 50%;

    background:
      rgba(
        139,
        92,
        246,
        0.08
      );

    filter: blur(80px);

    pointer-events: none;

  }


  @media (max-width: 850px) {

    min-height: auto;

    padding:
      30px 7%;

  }

`;


/* =====================================================
   LOGO
===================================================== */

const LogoLink = styled(Link)`

  display: inline-flex;

  text-decoration: none;

`;


const LogoImage = styled.img`

  width: 150px;

  height: auto;

  display: block;

  object-fit: contain;

`;


/* =====================================================
   LEFT CONTENT
===================================================== */

const LeftContent = styled.div`

  position: relative;

  z-index: 2;

  max-width: 620px;

  margin-top: 105px;


  @media (max-width: 850px) {

    margin-top: 60px;

  }

`;


const SmallLabel = styled.div`

  color: #9b7bea;

  font-size: 9px;

  font-weight: 700;

  letter-spacing: 2px;

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

  line-height: 1.02;

  letter-spacing: -3px;

  font-weight: 800;

`;


const Gradient = styled.span`

  display: block;

  background:
    linear-gradient(
      90deg,
      #a78bfa,
      #7c3aed,
      #d8b4fe
    );

  -webkit-background-clip: text;

  -webkit-text-fill-color: transparent;

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

  max-width: 520px;

  color: #aaa2bd;

  font-size: 16px;

  line-height: 1.8;

  margin-top: 25px;

`;


/* =====================================================
   FEATURES
===================================================== */

const Features = styled.div`

  display: flex;

  flex-direction: column;

  gap: 25px;

  margin-top: 75px;

`;


const Feature = styled.div`

  display: flex;

  align-items: center;

  gap: 15px;

`;


const FeatureIcon = styled.div`

  width: 45px;

  height: 45px;

  flex-shrink: 0;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 12px;

  color: #a78bfa;

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

  font-size: 18px;

`;


const FeatureTitle = styled.div`

  color: #bcb4ca;

  font-size: 10px;

  font-weight: 700;

  letter-spacing: 1.5px;

`;


const FeatureText = styled.div`

  color: #70687e;

  font-size: 11px;

  margin-top: 5px;

`;


/* =====================================================
   RIGHT PANEL
===================================================== */

const RightPanel = styled.section`

  min-height: 100vh;

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

    min-height: auto;

    padding:
      35px 7% 70px;

  }

`;


/* =====================================================
   BACK
===================================================== */

const BackLink = styled(Link)`

  display: inline-flex;

  align-items: center;

  gap: 10px;

  color: #aaa2b8;

  text-decoration: none;

  font-size: 10px;

  font-weight: 700;

  letter-spacing: 1.5px;


  &:hover {

    color: white;

  }

`;


const BackIcon = styled.span`

  width: 40px;

  height: 40px;

  display: flex;

  align-items: center;

  justify-content: center;

  border-radius: 10px;

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

  font-size: 20px;

`;


/* =====================================================
   FORM CONTAINER
===================================================== */

const FormContainer = styled.div`

  width: 100%;

  max-width: 540px;

  margin:
    70px auto 0;

`;


const FormHeader = styled.div`

  margin-bottom: 38px;

`;


const Title = styled.h2`

  margin: 0;

  font-size:
    clamp(
      34px,
      4vw,
      46px
    );

  letter-spacing: -2px;

  font-weight: 800;

`;


const Subtitle = styled.p`

  margin-top: 12px;

  color: #aaa3b7;

  font-size: 15px;

  line-height: 1.7;

`;


const CreateLink = styled(Link)`

  color: #9b6cff;

  font-weight: 700;

  text-decoration: none;


  &:hover {

    color: #b99cff;

    text-decoration: underline;

  }

`;


const PhoneText = styled.strong`

  color: #bca6ff;

  display: inline-block;

  margin-top: 5px;

`;


/* =====================================================
   LOGIN TABS
===================================================== */

const LoginTabs = styled.div`

  width: 100%;

  height: 58px;

  display: grid;

  grid-template-columns:
    1fr 1fr;

  padding: 5px;

  margin-bottom: 40px;

  border-radius: 15px;

  background: #171727;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.07
    );

`;


const LoginTab = styled.button`

  border: none;

  border-radius: 11px;

  background:
    ${(props) =>
      props.$active
        ? "#8b5cf6"
        : "transparent"};

  color:
    ${(props) =>
      props.$active
        ? "#ffffff"
        : "#81798f"};

  font-size: 10px;

  font-weight: 800;

  letter-spacing: 1px;

  cursor: pointer;

  transition: 0.25s;


  &:hover {

    color: white;

  }

`;


/* =====================================================
   FORM
===================================================== */

const Form = styled.form`

  display: flex;

  flex-direction: column;

  gap: 30px;

`;


const Field = styled.div`

  width: 100%;

`;


const Label = styled.label`

  display: block;

  color: #777083;

  font-size: 9px;

  font-weight: 700;

  letter-spacing: 2px;

  margin-bottom: 12px;

`;


const PasswordHeader = styled.div`

  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 12px;


  ${Label} {

    margin-bottom: 0;

  }

`;


const ForgotLink = styled(Link)`

  color: #9360f7;

  font-size: 9px;

  font-weight: 700;

  letter-spacing: 1px;

  text-decoration: none;


  &:hover {

    color: #b99cff;

  }

`;


/* =====================================================
   INPUT
===================================================== */

const InputWrapper = styled.div`

  height: 70px;

  display: flex;

  align-items: center;

  gap: 14px;

  padding:
    0 18px;

  border-radius: 15px;

  background: #171727;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  transition: 0.25s;


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

  color: #888096;

  font-size: 20px;

  width: 22px;

  text-align: center;

  flex-shrink: 0;

`;


const Input = styled.input`

  flex: 1;

  width: 100%;

  height: 100%;

  border: none;

  outline: none;

  background: transparent;

  color: white;

  font-size: 15px;

  min-width: 0;


  &::placeholder {

    color: #777286;

  }

`;


/* =====================================================
   PASSWORD
===================================================== */

const ShowPassword = styled.button`

  border: none;

  background: transparent;

  color: #81798f;

  cursor: pointer;

  font-size: 18px;

  padding: 5px;

  flex-shrink: 0;


  &:hover {

    color: white;

  }

`;


/* =====================================================
   PHONE INPUT
===================================================== */

const PhoneWrapper = styled.div`

  width: 100%;

  height: 70px;

  border-radius: 15px;

  background: #171727;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  transition: 0.25s;


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

    width: 100%;

    height: 100%;

  }


  .form-control {

    width:
      100% !important;

    height:
      68px !important;

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
      68px !important;

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
   OTP
===================================================== */

const OTPInput = styled.input`

  flex: 1;

  width: 100%;

  height: 100%;

  border: none;

  outline: none;

  background: transparent;

  color: white;

  font-size: 20px;

  letter-spacing: 5px;

  min-width: 0;


  &::placeholder {

    color: #777286;

    letter-spacing: 0;

    font-size: 13px;

  }

`;


/* =====================================================
   LOGIN BUTTON
===================================================== */

const LoginButton = styled.button`

  height: 68px;

  border: none;

  border-radius: 12px;

  background:
    linear-gradient(
      100deg,
      #8b5cf6,
      #a78bfa
    );

  color: white;

  font-size: 12px;

  font-weight: 800;

  letter-spacing: 3px;

  cursor: pointer;

  margin-top: 5px;

  transition: 0.25s;

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

    opacity: 0.6;

    cursor: not-allowed;

  }

`;


/* =====================================================
   CHANGE NUMBER
===================================================== */

const ChangeNumber = styled.button`

  border: none;

  background: transparent;

  color: #9b7bea;

  font-size: 11px;

  cursor: pointer;

  margin-top: -10px;


  &:hover {

    color: #c4a7ff;

  }

`;


/* =====================================================
   MESSAGE
===================================================== */

const Message = styled.div`

  padding:
    13px 15px;

  border-radius: 10px;

  background:
    rgba(
      139,
      92,
      246,
      0.1
    );

  border:
    1px solid
    rgba(
      139,
      92,
      246,
      0.2
    );

  color: #bca6ff;

  text-align: center;

  font-size: 11px;

  line-height: 1.5;

  margin-top: 20px;

`;


export default Login;