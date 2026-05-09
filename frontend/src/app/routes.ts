import { createBrowserRouter } from "react-router";
import { LoginScreen } from "./components/LoginScreen";
import { MainLayout } from "./components/MainLayout";
import { HomeScreen } from "./components/HomeScreen";
import { SubjectScreen } from "./components/SubjectScreen";
import { ChatScreen } from "./components/ChatScreen";
import { ChatGroupScreen } from "./components/ChatGroupScreen";
import { FinancesScreen } from "./components/FinancesScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginScreen,
    ErrorBoundary,
  },
  {
    path: "/app",
    Component: MainLayout,
    ErrorBoundary,
    children: [
      {
        index: true,
        Component: HomeScreen,
      },
      {
        path: "subject/:subjectId",
        Component: SubjectScreen,
      },
      {
        path: "chat",
        Component: ChatScreen,
      },
      {
        path: "chat/:groupId",
        Component: ChatGroupScreen,
      },
      {
        path: "finances",
        Component: FinancesScreen,
      },
      {
        path: "profile",
        Component: ProfileScreen,
      },
    ],
  },
]);
