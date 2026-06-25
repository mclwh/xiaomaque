import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { ArkApiKeySetupNotice } from "@/components/home/ArkApiKeySetupNotice";
import { AuthSessionRestore } from "@/hooks/useAuthSessionRestore";
import { router } from "@/router";
import { store } from "@/store";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Provider store={store}>
            <AuthSessionRestore />
            <ArkApiKeySetupNotice />
            <RouterProvider router={router} />
        </Provider>
    </StrictMode>,
);
