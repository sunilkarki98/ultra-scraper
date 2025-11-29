import { useAuth } from "../../../hooks/user/useAuth";
import { userService } from "../../../lib/api/services/user.service";
import toast from "react-hot-toast";
import { ScrapeFormProvider, useScrapeForm } from "./scrape/ScrapeFormContext";
import { ModeToggle } from "./scrape/ModeToggle";
import { NonTechnicalView } from "./scrape/NonTechnicalView";
import { TechnicalView } from "./scrape/TechnicalView";

function ScrapeFormContent() {
  const {
    mode,
    url, setUrl,
    task,
    workflow,
    llmConfig,
    outputFormat,
    customPrompt,
    loading, setLoading
  } = useScrapeForm();

  const { token } = useAuth();

  const handleSubmit = async () => {
    if (!url && workflow !== "llm-only") {
      toast.error("Please enter a URL");
      return;
    }

    setLoading(true);
    try {
      // Construct options based on mode
      let options: any = {
        mode,
        workflow: mode === "simple" ? "scraper-llm" : workflow,
      };

      if (mode === "simple") {
        options.aiPrompt = task;
        options.llmConfig = {
          provider: "openai", // Default
          model: "gpt-4o",
        };
      } else {
        options.aiPrompt = customPrompt;
        options.llmConfig = llmConfig;
        options.outputFormat = outputFormat;
      }

      const data = await userService.scrape(url, options);

      if (data.success) {
        toast.success(`Scrape started! Job ID: ${data.jobId}`);
        // Reset form logic could go here
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start scrape");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">🚀 Start New Scrape</h2>
      </div>

      <ModeToggle />

      {mode === "simple" ? <NonTechnicalView /> : <TechnicalView />}

      <div className="mt-8 pt-6 border-t border-slate-700">
        <button
          onClick={handleSubmit}
          disabled={loading || (!url && workflow !== "llm-only")}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">🔄</span> Processing...
            </>
          ) : (
            <>
              🚀 {mode === "simple" ? "Start Magic Scrape" : "Execute Workflow"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function ScrapeForm() {
  return (
    <ScrapeFormProvider>
      <ScrapeFormContent />
    </ScrapeFormProvider>
  );
}