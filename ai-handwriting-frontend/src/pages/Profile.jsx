import { useEffect, useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "/api";

function Profile() {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  /* =====================================================
     LOAD USER
  ===================================================== */

  useEffect(() => {

    loadUser();

  }, []);


  const loadUser = async () => {

    try {

      const response = await fetch(
        `${API_URL}/auth/me`,
        {
          method: "GET",
          credentials: "include",
        }
      );


      const data =
        await response.json();


      console.log(
        "PROFILE USER:",
        data
      );


      if (
        !data.authenticated ||
        !data.user
      ) {

        localStorage.removeItem(
          "scriptlyUser"
        );

        navigate("/login");

        return;
      }


      setUser(data.user);


      /* Keep localStorage updated */

      localStorage.setItem(
        "scriptlyUser",
        JSON.stringify(
          data.user
        )
      );


    } catch (error) {

      console.error(
        "Profile loading error:",
        error
      );

      const savedUser =
        localStorage.getItem(
          "scriptlyUser"
        );


      if (savedUser) {

        try {

          setUser(
            JSON.parse(
              savedUser
            )
          );

        } catch {

          localStorage.removeItem(
            "scriptlyUser"
          );

          navigate("/login");

        }

      } else {

        navigate("/login");

      }

    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {

    try {

      await fetch(
        `${API_URL}/auth/logout`,
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

    }


    localStorage.removeItem(
      "scriptlyUser"
    );


    navigate("/login");

  };


  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {

    if (!date) {
      return "Not available";
    }


    try {

      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );

    } catch {

      return date;

    }

  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

    return (

      <Page>

        <Loading>
          Loading profile...
        </Loading>

      </Page>

    );

  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <Page>


      {/* =================================================
          NAVBAR
      ================================================= */}

      <Navbar>


        {/* TEXT LOGO - NO IMAGE */}

        <LogoLink to="/dashboard">
          SCRIPTLY
        </LogoLink>


        <NavLinks>

          <NavLink to="/dashboard">
            Dashboard
          </NavLink>


          <NavLink to="/">
            Home
          </NavLink>


          <NavLink to="/performance">
            Performance
          </NavLink>


          <Active>
            Profile
          </Active>


          <LogoutButton
            type="button"
            onClick={handleLogout}
          >
            Logout
          </LogoutButton>

        </NavLinks>

      </Navbar>



      {/* =================================================
          MAIN
      ================================================= */}

      <Main>


        {/* =================================================
            HEADER
        ================================================= */}

        <Header>

          <Label>
            ACCOUNT
          </Label>


          <Title>
            My Profile
          </Title>


          <Subtitle>
            View your Scriptly account details.
          </Subtitle>

        </Header>



        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <ProfileCard>


          {/* =================================================
              PROFILE HEADER
          ================================================= */}

          <ProfileHeader>


            <Avatar>

              {user?.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "U"}

            </Avatar>


            <div>

              <UserName>
                {user?.name ||
                  "User"}
              </UserName>


              <UserEmail>
                {user?.email ||
                  "No email available"}
              </UserEmail>

            </div>


          </ProfileHeader>



          {/* =================================================
              DETAILS
          ================================================= */}

          <Details>


            {/* NAME */}

            <Detail>

              <DetailLabel>
                FULL NAME
              </DetailLabel>


              <DetailValue>
                {user?.name ||
                  "Not available"}
              </DetailValue>

            </Detail>



            {/* EMAIL */}

            <Detail>

              <DetailLabel>
                EMAIL ADDRESS
              </DetailLabel>


              <DetailValue>
                {user?.email ||
                  "Not available"}
              </DetailValue>

            </Detail>



            {/* PHONE */}

            <Detail>

              <DetailLabel>
                PHONE NUMBER
              </DetailLabel>


              <DetailValue>
                {user?.phone
                  ? `+${user.phone}`
                  : "Not provided"}
              </DetailValue>

            </Detail>



            {/* ACCOUNT CREATED */}

            <Detail>

              <DetailLabel>
                ACCOUNT CREATED
              </DetailLabel>


              <DetailValue>
                {formatDate(
                  user?.created_at
                )}
              </DetailValue>

            </Detail>


          </Details>



          {/* =================================================
              ACTIONS
          ================================================= */}

          <Actions>


            <BackButton
              to="/dashboard"
            >
              ← Back to Dashboard
            </BackButton>


            <EditButton
              type="button"
              onClick={() => {
                alert(
                  "Profile editing will be added next."
                );
              }}
            >
              Edit Profile
            </EditButton>


          </Actions>


        </ProfileCard>



        {/* =================================================
            ACCOUNT INFORMATION
        ================================================= */}

        <InfoCard>

          <InfoLabel>
            SCRIPTLY ACCOUNT
          </InfoLabel>


          <InfoTitle>
            Your learning profile
          </InfoTitle>


          <InfoText>
            Your practice progress,
            character improvement and
            handwriting attempts are
            connected to this account.
          </InfoText>

        </InfoCard>


      </Main>

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
      circle at 85% 10%,
      rgba(
        124,
        58,
        237,
        0.18
      ),
      transparent 30%
    ),
    #0b0718;

  color: white;

`;


/* =====================================================
   LOADING
===================================================== */

const Loading = styled.div`

  min-height: 100vh;

  display: flex;

  align-items: center;

  justify-content: center;

  color: #bca6ff;

  font-size: 14px;

`;


/* =====================================================
   NAVBAR
===================================================== */

const Navbar = styled.nav`

  height: 78px;

  padding:
    0 6%;

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  border-bottom:
    1px solid
    rgba(
      255,
      255,
      255,
      0.07
    );

`;


/* =====================================================
   LOGO
===================================================== */

const LogoLink = styled(Link)`

  color: white;

  text-decoration: none;

  font-size: 23px;

  font-weight: 800;

  letter-spacing: 2px;

`;


/* =====================================================
   NAVIGATION
===================================================== */

const NavLinks = styled.div`

  display: flex;

  align-items: center;

  gap: 30px;


  @media (max-width: 700px) {

    gap: 15px;

  }

`;


const NavLink = styled(Link)`

  color: #91899f;

  text-decoration: none;

  font-size: 13px;

  transition: 0.2s;


  &:hover {

    color: white;

  }


  @media (max-width: 700px) {

    font-size: 11px;

  }

`;


const Active = styled.span`

  color: #b99cff;

  font-size: 13px;


  @media (max-width: 700px) {

    font-size: 11px;

  }

`;


/* =====================================================
   LOGOUT
===================================================== */

const LogoutButton = styled.button`

  border: none;

  background: transparent;

  color: #91899f;

  font-size: 13px;

  cursor: pointer;

  padding: 0;

  transition: 0.2s;


  &:hover {

    color: white;

  }


  @media (max-width: 700px) {

    font-size: 11px;

  }

`;


/* =====================================================
   MAIN
===================================================== */

const Main = styled.main`

  width:
    min(
      900px,
      88%
    );

  margin: auto;

  padding:
    65px 0 100px;

`;


/* =====================================================
   HEADER
===================================================== */

const Header = styled.div`

  margin-bottom: 35px;

`;


const Label = styled.div`

  color: #9676e8;

  font-size: 9px;

  font-weight: 700;

  letter-spacing: 2px;

`;


const Title = styled.h1`

  margin:
    10px 0 8px;

  font-size: 42px;

  letter-spacing:
    -1.5px;


  @media (max-width: 600px) {

    font-size: 34px;

  }

`;


const Subtitle = styled.p`

  margin: 0;

  color: #91899f;

  font-size: 14px;

`;


/* =====================================================
   PROFILE CARD
===================================================== */

const ProfileCard = styled.div`

  padding: 35px;

  border-radius: 20px;

  background:
    rgba(
      255,
      255,
      255,
      0.045
    );

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );


  @media (max-width: 600px) {

    padding: 25px;

  }

`;


/* =====================================================
   PROFILE HEADER
===================================================== */

const ProfileHeader = styled.div`

  display: flex;

  align-items: center;

  gap: 20px;

  padding-bottom: 30px;

  border-bottom:
    1px solid
    rgba(
      255,
      255,
      255,
      0.07
    );

`;


/* =====================================================
   AVATAR
===================================================== */

const Avatar = styled.div`

  width: 70px;

  height: 70px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  flex-shrink: 0;

  background:
    linear-gradient(
      135deg,
      #8b5cf6,
      #6d28d9
    );

  color: white;

  font-size: 28px;

  font-weight: 800;

  box-shadow:
    0 10px 30px
    rgba(
      124,
      58,
      237,
      0.25
    );

`;


/* =====================================================
   USER NAME
===================================================== */

const UserName = styled.h2`

  margin: 0;

  font-size: 24px;

`;


const UserEmail = styled.p`

  margin:
    6px 0 0;

  color: #81798f;

  font-size: 12px;

`;


/* =====================================================
   DETAILS
===================================================== */

const Details = styled.div`

  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 0 40px;


  @media (max-width: 650px) {

    grid-template-columns:
      1fr;

  }

`;


const Detail = styled.div`

  padding:
    25px 0;

  border-bottom:
    1px solid
    rgba(
      255,
      255,
      255,
      0.06
    );

`;


const DetailLabel = styled.div`

  color: #716a7d;

  font-size: 8px;

  font-weight: 700;

  letter-spacing: 1.5px;

  margin-bottom: 9px;

`;


const DetailValue = styled.div`

  color: #eeeaf5;

  font-size: 14px;

  word-break: break-word;

`;


/* =====================================================
   ACTIONS
===================================================== */

const Actions = styled.div`

  display: flex;

  align-items: center;

  justify-content:
    space-between;

  gap: 15px;

  margin-top: 30px;


  @media (max-width: 550px) {

    flex-direction:
      column;

    align-items:
      stretch;

  }

`;


const BackButton = styled(Link)`

  color: #91899f;

  text-decoration: none;

  font-size: 11px;

  transition: 0.2s;


  &:hover {

    color: white;

  }

`;


/* =====================================================
   EDIT BUTTON
===================================================== */

const EditButton = styled.button`

  border: none;

  background:
    linear-gradient(
      135deg,
      #8b5cf6,
      #7c3aed
    );

  color: white;

  padding:
    12px 22px;

  border-radius: 9px;

  font-size: 11px;

  font-weight: 700;

  cursor: pointer;

  transition: 0.2s;


  &:hover {

    transform:
      translateY(-2px);

    box-shadow:
      0 8px 25px
      rgba(
        124,
        58,
        237,
        0.25
      );

  }

`;


/* =====================================================
   INFORMATION CARD
===================================================== */

const InfoCard = styled.div`

  margin-top: 20px;

  padding: 25px;

  border-radius: 16px;

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
      0.06
    );

`;


const InfoLabel = styled.div`

  color: #9676e8;

  font-size: 8px;

  font-weight: 700;

  letter-spacing: 1.5px;

`;


const InfoTitle = styled.h3`

  margin:
    8px 0;

  font-size: 17px;

`;


const InfoText = styled.p`

  margin: 0;

  max-width: 600px;

  color: #777083;

  font-size: 11px;

  line-height: 1.7;

`;


export default Profile;