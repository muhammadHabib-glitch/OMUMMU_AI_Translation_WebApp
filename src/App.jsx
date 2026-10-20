import { Routes, Route, Navigate } from "react-router-dom";
import Translate from "./components/Translate";
import AiAssistant from "./components/AiAssistant";
import Learning from "./components/Learning";
import LessonViewer from "./components/Learn/LessonViewer";
import Vocabulary from "./components/Learn/Vocabulary";
import Flashcards from "./components/Learn/Flashcards";
import Quiz from "./components/Learn/Quiz";
import Exercise from "./components/Learn/Exercise";
import Conversation from "./components/Learn/Conversation";
import Speaking from "./components/Learn/Speaking";
import Community from "./components/Community";
import History from "./components/History";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import BillingSuccess from "./components/BillingSuccess";
import BillingCancel from "./components/BillingCancel";
import AdminDashboard from "./components/admin/AdminDashboard";
import { ProtectedRoute, GuestRoute } from "./components/ProtectedRoute";
import { getToken } from "./services/apiClient";
import VerifyOtp from "./components/VerifyOtp";
import ForgotPassword from "./components/ForgotPassword";
import VerifyResetOtp from "./components/VerifyResetOtp";
import ResetPassword from "./components/ResetPassword";

function HomeRedirect() {
  return <Navigate to={getToken() ? "/translate" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <Signup />
          </GuestRoute>
        }
      />
      <Route
        path="/verify-otp"
        element={
          <GuestRoute>
            <VerifyOtp />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        }
      />
      <Route
        path="/verify-reset-otp"
        element={
          <GuestRoute>
            <VerifyResetOtp />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        }
      />

      <Route
        path="/translate"
        element={
          <ProtectedRoute>
            <Translate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <AiAssistant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/flashcards"
        element={
          <ProtectedRoute>
            <Flashcards />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/quizzes"
        element={
          <ProtectedRoute>
            <Quiz />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/exercises"
        element={
          <ProtectedRoute>
            <Exercise />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/speaking"
        element={
          <ProtectedRoute>
            <Speaking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/conversation"
        element={
          <ProtectedRoute>
            <Conversation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/vocabulary"
        element={
          <ProtectedRoute>
            <Vocabulary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn/lesson/:lessonId"
        element={
          <ProtectedRoute>
            <LessonViewer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn"
        element={
          <ProtectedRoute>
            <Learning />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/success"
        element={
          <ProtectedRoute>
            <BillingSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/cancel"
        element={
          <ProtectedRoute>
            <BillingCancel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
