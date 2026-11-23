
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import AppRoutes from "@/routes/AppRoutes";

import "@/styles/global.css";

// Restore the last selected appearance before React paints the app.
try {
  const theme = window.localStorage.getItem("edumanage.theme");
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const useDark = theme === "dark" || (theme === "system" && media.matches);
  document.documentElement.classList.toggle("dark", useDark);
  if (theme === "system") {
    media.addEventListener("change", (event) => {
      document.documentElement.classList.toggle("dark", event.matches);
    });
  }
} catch {
  // The app still starts normally when browser storage is unavailable.
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
     
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
     
    </QueryClientProvider>
  </StrictMode>,
);
