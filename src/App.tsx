import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

import DashboardHome from "./components/dashboard/DashboardHome";
import Parcelles from "./pages/dashboard/Parcelles";
import Recoltes from "./pages/dashboard/Recoltes";
import Collecte from "./pages/dashboard/Collecte";
import Transformation from "./pages/dashboard/Transformation";
import Conditionnement from "./pages/dashboard/Conditionnement";
import QRCodes from "./pages/dashboard/QRCodes";
import Cooperative from "./pages/dashboard/Cooperative";
import Audits from "./pages/dashboard/Audits";
import Utilisateurs from "./pages/dashboard/Utilisateurs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="parcelles" element={<Parcelles />} />
            <Route path="recoltes" element={<Recoltes />} />
            <Route path="collecte" element={<Collecte />} />
            <Route path="transformation" element={<Transformation />} />
            <Route path="conditionnement" element={<Conditionnement />} />
            <Route path="qrcodes" element={<QRCodes />} />
            <Route path="cooperative" element={<Cooperative />} />
            <Route path="audits" element={<Audits />} />
            <Route path="utilisateurs" element={<Utilisateurs />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
