import { useTheme, AVAILABLE_THEMES } from "../../../context/ThemeContext";
import { 
  // Palette, 
  Check, 
  Layout, 
  // Sparkles 
} from "lucide-react";

export default function Settings() {
  const { currentTheme, setThemeById } = useTheme();

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      {/* <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <Palette className="h-8 w-8 text-secondary" />
          Theme Settings
        </h1>
        <p className="text-gray-500 mt-2">
          Customize your dashboard workspace. Select a color palette that suits your professional style.
        </p>
      </div> */}

      {/* Theme Cards Grid */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {/* <Sparkles className="h-5 w-5 text-secondary" /> */}
            Dashboard Color Theme
          </h2>
          {/* <p className="text-sm text-gray-400 mt-1">
            This will update the primary buttons, side navigation gradient, icons, and focus highlights across the dashboard.
          </p> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_THEMES.map((theme) => {
            const isSelected = theme.id === currentTheme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setThemeById(theme.id)}
                className={`relative flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 group cursor-pointer ${
                  isSelected
                    ? "border-secondary bg-secondary/5 shadow-md shadow-secondary/5"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/55 hover:shadow-sm"
                }`}
              >
                {/* Color Swatch Preview */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${theme.dark}, ${theme.primary})`,
                  }}
                >
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isSelected ? "text-secondary" : "text-gray-700"}`}>
                    {theme.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {theme.primary}
                  </p>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="bg-gray-50/70 border border-gray-100 rounded-3xl p-6 lg:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Layout className="h-5 w-5 text-secondary" />
            Live Component Preview
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            See how your chosen theme looks applied to standard interface elements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-100">

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Buttons & Badges</label>
            <div className="flex flex-wrap gap-3 items-center">
              <button className="px-5 py-2.5 bg-secondary text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:opacity-95 transition-all duration-300 text-sm">
                Primary Button
              </button>
              <button className="px-5 py-2.5 border border-secondary text-secondary font-bold rounded-xl hover:bg-secondary/5 transition-all duration-300 text-sm">
                Outline Button
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary/10 text-secondary border border-secondary/20">
                Active Status
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                Inactive
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Form Inputs & Selection</label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Focused Input Field..."
                  readOnly
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-secondary bg-white focus:outline-none shadow-sm shadow-secondary/5"
                />
                <span className="absolute right-3 top-3 text-[10px] font-bold text-secondary uppercase tracking-wide">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="w-4 h-4 rounded text-secondary border-gray-300 focus:ring-secondary accent-secondary"
                />
                <span className="text-sm text-gray-600 font-medium">Selected option checkbox</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
