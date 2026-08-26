import { useRef } from "react";
import { ArrowCounterClockwise, ImageSquare, Palette, SealCheck, TrashSimple } from "@phosphor-icons/react";
import { useStore } from "../../store/store";
import ShopLogo from "../../components/ShopLogo";
import { Badge, Button, Card, Field, inputClass } from "../../components/ui";
import { DEFAULT_SETTINGS, processLogoFile } from "../../lib/theme";

const PRESETS = [
  { hex: "#c96b2e", label: "Laranja clássico" },
  { hex: "#9c4a38", label: "Vinho" },
  { hex: "#6d7f4b", label: "Verde oliva" },
  { hex: "#ad571f", label: "Terracota" },
  { hex: "#2f6d75", label: "Azul-petróleo" },
  { hex: "#4a3728", label: "Café" },
];

export default function Configuracoes() {
  const { state, dispatch } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const settings = state.settings;

  function onPickAccent(hex: string) {
    dispatch({ type: "settings/save", settings: { accent: hex } });
  }

  async function onLogoFile(file: File) {
    try {
      const dataUrl = await processLogoFile(file);
      dispatch({ type: "settings/save", settings: { logo: dataUrl } });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Não foi possível carregar a imagem.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <p className="text-sm text-bark-600">
        Personalize a cor principal e a marca — as mudanças valem para o site público e para este
        painel na hora.
      </p>

      {/* cor principal */}
      <Card className="p-5 sm:p-6">
        <h3 className="flex items-center gap-2 font-bold text-bark-900">
          <Palette size={18} weight="duotone" className="text-ember-600" />
          Cor principal
        </h3>
        <p className="mt-1 text-xs text-bark-500">
          Botões, destaques, gráficos e links seguem esta cor automaticamente.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.hex}
              onClick={() => onPickAccent(p.hex)}
              title={p.label}
              aria-label={`Cor ${p.label}`}
              className={`relative h-11 w-11 cursor-pointer rounded-xl transition-transform hover:scale-105 ${
                settings.accent.toLowerCase() === p.hex
                  ? "ring-2 ring-bark-900 ring-offset-2 ring-offset-paper-100"
                  : ""
              }`}
              style={{ background: p.hex }}
            >
              {settings.accent.toLowerCase() === p.hex && (
                <SealCheck size={18} weight="fill" className="absolute inset-0 m-auto text-paper-50" />
              )}
            </button>
          ))}

          <label
            className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-sand-400 text-bark-500 transition-colors hover:border-ember-400"
            title="Cor personalizada"
          >
            <input
              type="color"
              value={settings.accent}
              onChange={(e) => onPickAccent(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Escolher cor personalizada"
            />
            <span className="pointer-events-none text-[10px] font-bold">RGB</span>
          </label>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-xl bg-paper-200 px-4 py-3">
          <span className="h-8 w-8 shrink-0 rounded-lg border border-black/10" style={{ background: settings.accent }} />
          <span className="tnum font-mono text-sm font-medium text-bark-800">{settings.accent.toUpperCase()}</span>
          <Badge tone="neutral">aplicado ao vivo</Badge>
        </div>
      </Card>

      {/* logo */}
      <Card className="p-5 sm:p-6">
        <h3 className="flex items-center gap-2 font-bold text-bark-900">
          <ImageSquare size={18} weight="duotone" className="text-ember-600" />
          Logo
        </h3>
        <p className="mt-1 text-xs text-bark-500">
          Quadrada, de preferência PNG/JPG com fundo sólido. Usada no site, painel e favicon.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <span className="rounded-2xl border border-sand-300 bg-[repeating-conic-gradient(#ece2cd_0%_25%,#f3ecdf_0%_50%)] bg-[length:16px_16px] p-2">
            <ShopLogo size={64} variant="accent" />
          </span>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onLogoFile(f);
                e.target.value = "";
              }}
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              Enviar imagem…
            </Button>
            {settings.logo && (
              <Button
                variant="ghost"
                className="block text-xs text-wine-500 hover:bg-wine-500/10"
                onClick={() => {
                  if (confirm("Remover a logo e voltar à marca padrão?")) {
                    dispatch({ type: "settings/save", settings: { logo: null } });
                  }
                }}
              >
                <TrashSimple size={13} /> Remover logo
              </Button>
            )}
            {!settings.logo && <p className="text-xs text-bark-500">Sem logo — usando a marca padrão.</p>}
          </div>
        </div>
      </Card>

      {/* nome */}
      <Card className="p-5 sm:p-6">
        <Field
          label="Nome da barbearia"
          hint="Aparece no cabeçalho do site, rodapé, tela de login e menu do painel."
        >
          <input
            className={`${inputClass} max-w-sm`}
            value={settings.shopName}
            onChange={(e) => dispatch({ type: "settings/save", settings: { shopName: e.target.value } })}
          />
        </Field>
      </Card>

      {/* preview */}
      <Card className="overflow-hidden">
        <div className="border-b border-sand-200 px-5 py-3.5">
          <h3 className="font-bold text-bark-900">Prévia</h3>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <ShopLogo size={40} variant="dark" />
            <div>
              <p className="text-sm font-bold text-bark-900">{settings.shopName}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bark-500">site público</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShopLogo size={40} variant="accent" />
            <div>
              <p className="text-sm font-bold text-bark-900">BarberFlow</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bark-500">painel admin</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button className="px-4 py-2 text-xs">Agendar horário</Button>
            <Badge tone="accent">mais escolhido</Badge>
          </div>
          <div className="flex items-center gap-2">
            <input type="range" readOnly min={0} max={100} defaultValue={62} className="w-full accent-ember-600" aria-label="prévia de slider" />
            <span className="tnum font-mono text-xs text-bark-600">62%</span>
          </div>
        </div>
      </Card>

      {/* restaurar */}
      <div className="flex items-center justify-between rounded-xl border border-dashed border-sand-400 bg-paper-100/60 px-5 py-4">
        <p className="text-sm text-bark-600">Quer desfazer tudo?</p>
        <Button
          variant="secondary"
          onClick={() => {
            if (confirm("Restaurar cor, logo e nome padrão?")) {
              dispatch({ type: "settings/save", settings: { ...DEFAULT_SETTINGS } });
            }
          }}
        >
          <ArrowCounterClockwise size={15} /> Restaurar padrão
        </Button>
      </div>
    </div>
  );
}
