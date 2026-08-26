import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeSlash, LockKey } from "@phosphor-icons/react";
import ShopLogo from "../../components/ShopLogo";
import { useAuth, useStore } from "../../store/store";

export default function Login() {
  const { login } = useAuth();
  const { state } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@navalhadeouro.com");
  const [password, setPassword] = useState("demo123");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim() === "admin@navalhadeouro.com" && password === "demo123") {
      setError(null);
      login();
      navigate("/admin", { replace: true });
    } else {
      setError("Credenciais incorretas. Use as credenciais de demonstração abaixo.");
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-bark-950 px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--color-ember-500) 40%, transparent) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 block w-fit shadow-lg shadow-black/30 [&>span]:rounded-2xl">
            <ShopLogo size={56} variant="accent" />
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-paper-100">BarberFlow</h1>
          <p className="mt-1 text-sm text-bark-400">Painel administrativo · {state.settings.shopName}</p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-paper-50/10 bg-bark-900 p-6 shadow-2xl sm:p-8"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-bark-300">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-paper-50/15 bg-bark-950/60 px-3.5 py-2.5 text-sm text-paper-100 outline-none transition-colors placeholder:text-bark-500 focus:border-ember-500 focus:ring-2 focus:ring-ember-500/30"
              autoComplete="username"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-bark-300">Senha</span>
            <span className="relative block">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-paper-50/15 bg-bark-950/60 px-3.5 py-2.5 pr-11 text-sm text-paper-100 outline-none transition-colors focus:border-ember-500 focus:ring-2 focus:ring-ember-500/30"
                autoComplete="current-password"
              />
              <button
                type="button"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-bark-400 hover:text-paper-100"
              >
                {show ? <EyeSlash size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>

          {error && (
            <p className="mt-3 rounded-lg bg-wine-500/15 px-3 py-2 text-xs font-medium text-ember-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ember-500 py-3 text-sm font-bold text-paper-50 transition-all hover:bg-ember-600 active:scale-[0.98]"
          >
            <LockKey size={16} weight="fill" />
            Entrar no painel
            <ArrowRight size={15} weight="bold" />
          </button>

          <p className="mt-5 rounded-lg border border-dashed border-paper-50/15 px-3 py-2.5 text-center text-[11px] leading-relaxed text-bark-400">
            MVP de demonstração — autenticação real documentada em{" "}
            <code className="rounded bg-bark-950 px-1 py-0.5 text-ember-200">docs/INTEGRACOES.md</code>
            <br />
            use: <strong className="text-bark-300">admin@navalhadeouro.com</strong> · senha{" "}
            <strong className="text-bark-300">demo123</strong>
          </p>
        </form>
      </div>
    </div>
  );
}
