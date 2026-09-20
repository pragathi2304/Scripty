import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";

const API = "/api";

export default function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [settings, setSettings] = useState({
    showFeedback: true,
    autoNextCharacter: false,
    soundEffects: true,
    pronunciation: true,
    notifications: true,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
    loadUser();
  }, []);

  const loadSettings = () => {
    try {
      const stored =
        localStorage.getItem(
          "scriptlySettings"
        );

      if (stored) {
        const parsed = JSON.parse(stored);

        setSettings((previous) => ({
          ...previous,
          ...parsed,
        }));
      }
    } catch (error) {
      console.error(
        "Unable to load settings:",
        error
      );
    }
  };

  const loadUser = async () => {
    try {
      const response = await fetch(
        `${API}/auth/me`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (
        response.ok &&
        data.authenticated
      ) {
        setUser(data.user || null);

        if (data.user) {
          localStorage.setItem(
            "scriptlyUser",
            JSON.stringify(data.user)
          );
        }
      } else {
        localStorage.removeItem(
          "scriptlyUser"
        );

        navigate("/login", {
          replace: true,
        });
      }
    } catch (error) {
      console.error(
        "Authentication check failed:",
        error
      );

      const storedUser =
        localStorage.getItem(
          "scriptlyUser"
        );

      if (storedUser) {
        try {
          setUser(
            JSON.parse(storedUser)
          );
        } catch {
          localStorage.removeItem(
            "scriptlyUser"
          );

          navigate("/login", {
            replace: true,
          });
        }
      } else {
        navigate("/login", {
          replace: true,
        });
      }
    }
  };

  const updateSetting = (
    key,
    value
  ) => {
    const updated = {
      ...settings,
      [key]: value,
    };

    setSettings(updated);

    localStorage.setItem(
      "scriptlySettings",
      JSON.stringify(updated)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  const resetSettings = () => {
    const defaultSettings = {
      showFeedback: true,
      autoNextCharacter: false,
      soundEffects: true,
      pronunciation: true,
      notifications: true,
    };

    setSettings(defaultSettings);

    localStorage.setItem(
      "scriptlySettings",
      JSON.stringify(defaultSettings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  const logout = async () => {
    try {
      await fetch(
        `${API}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
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

            <NavLink to="/dashboard">
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

            <NavLink
              to="/settings"
              $active
            >
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


      {/* =====================================================
          MAIN
      ===================================================== */}

      <Main>

        <PageHeader>

          <Eyebrow>
            ACCOUNT & PREFERENCES
          </Eyebrow>

          <Title>
            Settings
          </Title>

          <Subtitle>
            Manage your Scriptly preferences
            and learning experience.
          </Subtitle>

        </PageHeader>


        {/* =====================================================
            ACCOUNT
        ===================================================== */}

        <Section>

          <SectionHeader>

            <SectionEyebrow>
              ACCOUNT
            </SectionEyebrow>

            <SectionTitle>
              Account Information
            </SectionTitle>

          </SectionHeader>

          <SettingsCard>

            <AccountRow>

              <Avatar>
                {getInitial(
                  user?.name ||
                  user?.email ||
                  "U"
                )}
              </Avatar>

              <AccountInfo>

                <AccountName>
                  {user?.name ||
                    "Scriptly User"}
                </AccountName>

                <AccountEmail>
                  {user?.email ||
                    "Email not available"}
                </AccountEmail>

              </AccountInfo>

              <ProfileButton
                onClick={() =>
                  navigate("/profile")
                }
              >
                View Profile
              </ProfileButton>

            </AccountRow>

          </SettingsCard>

        </Section>


        {/* =====================================================
            PRACTICE SETTINGS
        ===================================================== */}

        <Section>

          <SectionHeader>

            <SectionEyebrow>
              PRACTICE
            </SectionEyebrow>

            <SectionTitle>
              Practice Preferences
            </SectionTitle>

            <SectionDescription>
              Customize how handwriting practice
              behaves.
            </SectionDescription>

          </SectionHeader>

          <SettingsCard>

            <SettingRow>

              <SettingInfo>

                <SettingTitle>
                  Show AI Feedback
                </SettingTitle>

                <SettingDescription>
                  Display handwriting feedback
                  after each practice attempt.
                </SettingDescription>

              </SettingInfo>

              <Toggle
                $enabled={
                  settings.showFeedback
                }
                onClick={() =>
                  updateSetting(
                    "showFeedback",
                    !settings.showFeedback
                  )
                }
                aria-label="Toggle AI feedback"
              >
                <ToggleCircle
                  $enabled={
                    settings.showFeedback
                  }
                />
              </Toggle>

            </SettingRow>


            <Divider />


            <SettingRow>

              <SettingInfo>

                <SettingTitle>
                  Automatically Continue
                </SettingTitle>

                <SettingDescription>
                  Automatically move to another
                  character after completing practice.
                </SettingDescription>

              </SettingInfo>

              <Toggle
                $enabled={
                  settings.autoNextCharacter
                }
                onClick={() =>
                  updateSetting(
                    "autoNextCharacter",
                    !settings.autoNextCharacter
                  )
                }
                aria-label="Toggle automatic next character"
              >
                <ToggleCircle
                  $enabled={
                    settings.autoNextCharacter
                  }
                />
              </Toggle>

            </SettingRow>

          </SettingsCard>

        </Section>


        {/* =====================================================
            AUDIO
        ===================================================== */}

        <Section>

          <SectionHeader>

            <SectionEyebrow>
              AUDIO
            </SectionEyebrow>

            <SectionTitle>
              Sound & Pronunciation
            </SectionTitle>

            <SectionDescription>
              Control pronunciation and sound
              features during learning.
            </SectionDescription>

          </SectionHeader>

          <SettingsCard>

            <SettingRow>

              <SettingIcon>
                🔊
              </SettingIcon>

              <SettingInfo>

                <SettingTitle>
                  Sound Effects
                </SettingTitle>

                <SettingDescription>
                  Enable interface and practice
                  sound effects.
                </SettingDescription>

              </SettingInfo>

              <Toggle
                $enabled={
                  settings.soundEffects
                }
                onClick={() =>
                  updateSetting(
                    "soundEffects",
                    !settings.soundEffects
                  )
                }
                aria-label="Toggle sound effects"
              >
                <ToggleCircle
                  $enabled={
                    settings.soundEffects
                  }
                />
              </Toggle>

            </SettingRow>


            <Divider />


            <SettingRow>

              <SettingIcon>
                🗣️
              </SettingIcon>

              <SettingInfo>

                <SettingTitle>
                  Pronunciation
                </SettingTitle>

                <SettingDescription>
                  Enable character pronunciation
                  when available.
                </SettingDescription>

              </SettingInfo>

              <Toggle
                $enabled={
                  settings.pronunciation
                }
                onClick={() =>
                  updateSetting(
                    "pronunciation",
                    !settings.pronunciation
                  )
                }
                aria-label="Toggle pronunciation"
              >
                <ToggleCircle
                  $enabled={
                    settings.pronunciation
                  }
                />
              </Toggle>

            </SettingRow>

          </SettingsCard>

        </Section>


        {/* =====================================================
            NOTIFICATIONS
        ===================================================== */}

        <Section>

          <SectionHeader>

            <SectionEyebrow>
              NOTIFICATIONS
            </SectionEyebrow>

            <SectionTitle>
              Learning Reminders
            </SectionTitle>

            <SectionDescription>
              Control reminders related to your
              learning activity.
            </SectionDescription>

          </SectionHeader>

          <SettingsCard>

            <SettingRow>

              <SettingIcon>
                🔔
              </SettingIcon>

              <SettingInfo>

                <SettingTitle>
                  Practice Reminders
                </SettingTitle>

                <SettingDescription>
                  Allow Scriptly to use practice
                  reminder preferences.
                </SettingDescription>

              </SettingInfo>

              <Toggle
                $enabled={
                  settings.notifications
                }
                onClick={() =>
                  updateSetting(
                    "notifications",
                    !settings.notifications
                  )
                }
                aria-label="Toggle notifications"
              >
                <ToggleCircle
                  $enabled={
                    settings.notifications
                  }
                />
              </Toggle>

            </SettingRow>

          </SettingsCard>

        </Section>


        {/* =====================================================
            RESET
        ===================================================== */}

        <Section>

          <SettingsCard>

            <ResetRow>

              <ResetInfo>

                <ResetTitle>
                  Reset Preferences
                </ResetTitle>

                <ResetDescription>
                  Restore your Scriptly settings
                  to their default values.
                </ResetDescription>

              </ResetInfo>

              <ResetButton
                onClick={resetSettings}
              >
                Reset Settings
              </ResetButton>

            </ResetRow>

          </SettingsCard>

        </Section>


        {/* =====================================================
            SAVED MESSAGE
        ===================================================== */}

        {saved && (
          <SavedMessage>
            ✓ Settings saved
          </SavedMessage>
        )}

      </Main>

    </Page>
  );
}


/* ============================================================
   HELPERS
============================================================ */

function getInitial(value) {
  const text = String(value || "U").trim();

  if (!text) {
    return "U";
  }

  return text.charAt(0).toUpperCase();
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
  width: min(1000px, 88%);

  margin: 0 auto;

  padding: 58px 0 100px;
`;


/* ============================================================
   HEADER
============================================================ */

const PageHeader = styled.div`
  margin-bottom: 48px;
`;

const Eyebrow = styled.div`
  color: #9f7cff;

  font-size: 12px;

  font-weight: 800;

  letter-spacing: 3px;

  margin-bottom: 12px;
`;

const Title = styled.h1`
  margin: 0;

  font-size: clamp(
    34px,
    5vw,
    52px
  );

  line-height: 1.08;

  letter-spacing: -1.5px;
`;

const Subtitle = styled.p`
  margin: 14px 0 0;

  color: rgba(
    255,
    255,
    255,
    0.52
  );

  font-size: 15px;

  line-height: 1.7;
`;


/* ============================================================
   SECTIONS
============================================================ */

const Section = styled.section`
  margin-top: 42px;
`;

const SectionHeader = styled.div`
  margin-bottom: 18px;
`;

const SectionEyebrow = styled.div`
  color: #9f7cff;

  font-size: 11px;

  font-weight: 800;

  letter-spacing: 2.5px;

  margin-bottom: 7px;
`;

const SectionTitle = styled.h2`
  margin: 0;

  font-size: 23px;

  letter-spacing: -0.5px;
`;

const SectionDescription = styled.p`
  margin: 6px 0 0;

  color: rgba(
    255,
    255,
    255,
    0.43
  );

  font-size: 13px;
`;


/* ============================================================
   SETTINGS CARD
============================================================ */

const SettingsCard = styled.div`
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
    linear-gradient(
      145deg,
      rgba(65, 34, 108, 0.36),
      rgba(34, 17, 63, 0.54)
    );

  box-shadow:
    0 16px 45px
    rgba(
      0,
      0,
      0,
      0.12
    );
`;


/* ============================================================
   ACCOUNT
============================================================ */

const AccountRow = styled.div`
  min-height: 100px;

  padding: 22px;

  display: flex;

  align-items: center;

  gap: 16px;

  @media (max-width: 600px) {
    flex-wrap: wrap;
  }
`;

const Avatar = styled.div`
  width: 54px;

  height: 54px;

  display: grid;

  place-items: center;

  flex: 0 0 auto;

  border-radius: 50%;

  background:
    linear-gradient(
      135deg,
      #7c3aed,
      #a78bfa
    );

  color: white;

  font-size: 20px;

  font-weight: 800;
`;

const AccountInfo = styled.div`
  flex: 1;

  min-width: 0;
`;

const AccountName = styled.div`
  font-size: 16px;

  font-weight: 750;
`;

const AccountEmail = styled.div`
  margin-top: 4px;

  color: rgba(
    255,
    255,
    255,
    0.42
  );

  font-size: 12px;

  overflow: hidden;

  text-overflow: ellipsis;

  white-space: nowrap;
`;

const ProfileButton = styled.button`
  padding: 10px 16px;

  border: 1px solid
    rgba(
      167,
      139,
      250,
      0.3
    );

  border-radius: 10px;

  background:
    rgba(
      124,
      58,
      237,
      0.12
    );

  color: #c8b8ff;

  font-size: 12px;

  font-weight: 700;

  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background:
      rgba(
        124,
        58,
        237,
        0.22
      );

    border-color:
      rgba(
        167,
        139,
        250,
        0.5
      );
  }
`;


/* ============================================================
   SETTING ROW
============================================================ */

const SettingRow = styled.div`
  min-height: 82px;

  padding: 18px 22px;

  display: flex;

  align-items: center;

  gap: 16px;
`;

const SettingInfo = styled.div`
  flex: 1;

  min-width: 0;
`;

const SettingTitle = styled.div`
  font-size: 14px;

  font-weight: 700;
`;

const SettingDescription = styled.div`
  margin-top: 5px;

  color: rgba(
    255,
    255,
    255,
    0.4
  );

  font-size: 12px;

  line-height: 1.5;
`;

const SettingIcon = styled.div`
  width: 42px;

  height: 42px;

  display: grid;

  place-items: center;

  flex: 0 0 auto;

  border-radius: 12px;

  background:
    rgba(
      139,
      92,
      246,
      0.12
    );

  font-size: 19px;
`;

const Divider = styled.div`
  height: 1px;

  margin: 0 22px;

  background:
    rgba(
      255,
      255,
      255,
      0.06
    );
`;


/* ============================================================
   TOGGLE
============================================================ */

const Toggle = styled.button`
  width: 48px;

  height: 26px;

  padding: 3px;

  display: flex;

  align-items: center;

  justify-content: ${(props) =>
    props.$enabled
      ? "flex-end"
      : "flex-start"};

  flex: 0 0 auto;

  border: 0;

  border-radius: 999px;

  background: ${(props) =>
    props.$enabled
      ? "#7c3aed"
      : "rgba(255,255,255,0.12)"};

  cursor: pointer;

  transition:
    background 0.2s ease;

  &:focus-visible {
    outline:
      2px solid #9f7cff;

    outline-offset: 3px;
  }
`;

const ToggleCircle = styled.span`
  width: 20px;

  height: 20px;

  display: block;

  border-radius: 50%;

  background: #ffffff;

  box-shadow:
    0 2px 6px
    rgba(
      0,
      0,
      0,
      0.25
    );
`;


/* ============================================================
   RESET
============================================================ */

const ResetRow = styled.div`
  padding: 22px;

  display: flex;

  align-items: center;

  gap: 20px;

  @media (max-width: 600px) {
    flex-direction: column;

    align-items: flex-start;
  }
`;

const ResetInfo = styled.div`
  flex: 1;
`;

const ResetTitle = styled.div`
  font-size: 14px;

  font-weight: 700;
`;

const ResetDescription = styled.div`
  margin-top: 5px;

  color: rgba(
    255,
    255,
    255,
    0.4
  );

  font-size: 12px;
`;

const ResetButton = styled.button`
  padding: 10px 16px;

  border: 1px solid
    rgba(
      255,
      255,
      255,
      0.13
    );

  border-radius: 10px;

  background:
    rgba(
      255,
      255,
      255,
      0.05
    );

  color: rgba(
    255,
    255,
    255,
    0.7
  );

  font-size: 12px;

  font-weight: 700;

  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background:
      rgba(
        255,
        255,
        255,
        0.09
      );

    border-color:
      rgba(
        255,
        255,
        255,
        0.22
      );
  }
`;


/* ============================================================
   SAVED MESSAGE
============================================================ */

const SavedMessage = styled.div`
  position: fixed;

  right: 28px;

  bottom: 28px;

  padding: 12px 18px;

  border: 1px solid
    rgba(
      167,
      139,
      250,
      0.25
    );

  border-radius: 12px;

  background:
    rgba(
      42,
      22,
      77,
      0.95
    );

  color: #c8b8ff;

  font-size: 12px;

  font-weight: 700;

  box-shadow:
    0 10px 30px
    rgba(
      0,
      0,
      0,
      0.3
    );

  z-index: 100;
`;