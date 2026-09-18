import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #0b0718;
    color: #ffffff;
  }

  button {
    font-family: inherit;
  }
`;

export default GlobalStyles;