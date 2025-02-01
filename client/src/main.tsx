import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from './App';
import "./index.css";
import "./lib/i18n";  // Import i18n configuration
import "./lib/amplify"; // Initialize Amplify configuration

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App/>
  </StrictMode>,
);