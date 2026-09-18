import styled from "styled-components";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <Nav>

      {/* ================= LOGO ================= */}

      <LogoLink to="/">

        <LogoImage
          src="/scriptly-logo.png"
          alt="SCRIPTLY"
        />

      </LogoLink>


      {/* ================= NAVIGATION ================= */}

      <Links>

        {/* HOME */}
        <NavLink href="#home">
          Home
        </NavLink>


        {/* LANGUAGES */}
        <NavLink href="#languages">
          Languages
        </NavLink>


        {/* FEATURES */}
        <NavLink href="#features">
          Features
        </NavLink>


        {/* ABOUT */}
        <NavLink href="#about">
          About
        </NavLink>

      </Links>


      {/* ================= SIGN IN ================= */}

      <SignIn
        as={Link}
        to="/login"
      >
        Sign In
      </SignIn>

    </Nav>
  );
}


/* =====================================================
   NAVBAR
===================================================== */

const Nav = styled.nav`

  position: absolute;

  top: 0;

  left: 0;

  right: 0;

  height: 80px;

  padding: 0 6%;

  display: flex;

  align-items: center;

  justify-content: space-between;

  z-index: 100;

  color: white;

`;


/* =====================================================
   LOGO
===================================================== */

const LogoLink = styled(Link)`

  display: flex;

  align-items: center;

  text-decoration: none;

  flex-shrink: 0;

`;


const LogoImage = styled.img`

  width: 190px;

  height: auto;

  display: block;

  object-fit: contain;

`;


/* =====================================================
   NAVIGATION
===================================================== */

const Links = styled.div`

  display: flex;

  gap: 38px;

  align-items: center;

  margin-left: auto;

  margin-right: 35px;


  @media (max-width: 800px) {

    display: none;

  }

`;


/* =====================================================
   NAV LINK
===================================================== */

const NavLink = styled.a`

  color: #b8afc9;

  font-size: 14px;

  text-decoration: none;

  transition: 0.3s;

  white-space: nowrap;

  cursor: pointer;


  &:hover {

    color: #ffffff;

  }

`;


/* =====================================================
   SIGN IN
===================================================== */

const SignIn = styled.button`

  border: none;

  background: #8b5cf6;

  color: white;

  padding: 12px 23px;

  border-radius: 10px;

  font-size: 14px;

  font-weight: 600;

  cursor: pointer;

  text-decoration: none;

  transition: 0.3s;

  white-space: nowrap;


  &:hover {

    background: #9d72f7;

    transform:
      translateY(-1px);

  }

`;
 

export default Navbar;