import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/spectral/300.css";
import "@fontsource/spectral/300-italic.css";
import "@fontsource/spectral/400.css";
import "@fontsource/spectral/400-italic.css";
import "@fontsource/spectral/600.css";
import "./style.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";

console.log(
  "%c" +
    "                        ▄▄▄▄\n" +
    "                     ▄▄████████▄\n" +
    "                   ▄████████████████▄\n" +
    "   ▄▄▄▄           ▄████████████████████▄\n" +
    "  ▐██████▌        ▄██████████████████████▌\n" +
    "  ▐███▌▄▀▌       ▄███████████████████████▌\n" +
    "   ▀▒▒▒▀        ▄████████████████████████▌        ▄▄\n" +
    "   ▒▓▒▒         █████████████████████████████▄▄▄██▀\n" +
    "   ▒▓▓▒▒       ██████████████████████████████████▀\n" +
    "   ▓▓▓▒▒▓     ███████████████████████████████████\n" +
    "   ▓▓▓▒▓▓▓▄ ████████████████████████████████████\n" +
    "   ▓▓▓▓▓▓▓▓▓█████████████████████████████████████▓\n" +
    "    ▓▓▓▓▓▓▓▓████████████████████████████████████▓▄\n" +
    "     ▓▓▓▓▓▓▀███████████████████████████████████▀  ▀▄\n" +
    "      ▓▓▓▀   ████████████████████████████████▀       ▀\n" +
    "              ████     █████████████████\n" +
    "              ████     █████████████████\n" +
    "             ▐████▌   ▐█████████████████▌\n" +
    "              ▀▀▀▀     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀\n" +
    "\n" +
    "   ██████╗  ██████╗  GRYFFIN CALORAI\n" +
    "  ██╔════╝ ██╔════╝  Field Journal · Calorie Intelligence\n" +
    "  ██║  ███╗██║\n" +
    "  ██║   ██║██║\n" +
    "  ╚██████╔╝╚██████╗\n" +
    "   ╚═════╝  ╚═════╝",
  "color:#e25022;font-family:monospace;line-height:1.5;",
);

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
