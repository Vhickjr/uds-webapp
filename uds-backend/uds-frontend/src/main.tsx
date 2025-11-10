import { createRoot } from "react-dom/client";
import { ComponentProvider } from "./contexts/ComponentContext";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ComponentProvider>
      <App />
    </ComponentProvider>
  </AuthProvider>
);
