import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import Landing from "./pages/public/Landing";

const Agenda = lazy(() => import("./pages/public/Agenda"));
const Login = lazy(() => import("./pages/admin/Login"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Equipe = lazy(() => import("./pages/admin/Equipe"));
const Servicos = lazy(() => import("./pages/admin/Servicos"));
const Agendamentos = lazy(() => import("./pages/admin/Agendamentos"));
const Financeiro = lazy(() => import("./pages/admin/Financeiro"));
const Assinantes = lazy(() => import("./pages/admin/Assinantes"));
const Configuracoes = lazy(() => import("./pages/admin/Configuracoes"));

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route
          path="/agenda"
          element={
            <Suspense>
              <Agenda />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/admin/login"
        element={
          <Suspense>
            <Login />
          </Suspense>
        }
      />
      <Route path="/admin" element={<AdminLayout />}>
        <Route
          index
          element={
            <Suspense>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="agendamentos"
          element={
            <Suspense>
              <Agendamentos />
            </Suspense>
          }
        />
        <Route
          path="equipe"
          element={
            <Suspense>
              <Equipe />
            </Suspense>
          }
        />
        <Route
          path="servicos"
          element={
            <Suspense>
              <Servicos />
            </Suspense>
          }
        />
        <Route
          path="financeiro"
          element={
            <Suspense>
              <Financeiro />
            </Suspense>
          }
        />
        <Route
          path="assinantes"
          element={
            <Suspense>
              <Assinantes />
            </Suspense>
          }
        />
        <Route
          path="configuracoes"
          element={
            <Suspense>
              <Configuracoes />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
