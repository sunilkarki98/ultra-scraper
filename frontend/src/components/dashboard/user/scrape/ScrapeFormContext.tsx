"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type ScrapeMode = "simple" | "advanced";
export type WorkflowType = "scraper-only" | "scraper-llm" | "llm-only";
export type OutputFormat = "text" | "json" | "markdown" | "xml";

export interface LLMConfig {
    provider: string;
    model: string;
    apiKey?: string;
    endpoint?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

interface ScrapeFormContextType {
    mode: ScrapeMode;
    setMode: (mode: ScrapeMode) => void;

    // Common State
    url: string;
    setUrl: (url: string) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;

    // Simple Mode State
    task: string;
    setTask: (task: string) => void;
    useOwnProvider: boolean;
    setUseOwnProvider: (use: boolean) => void;

    // Advanced Mode State
    workflow: WorkflowType;
    setWorkflow: (workflow: WorkflowType) => void;
    llmConfig: LLMConfig;
    setLlmConfig: (config: LLMConfig) => void;
    outputFormat: OutputFormat;
    setOutputFormat: (format: OutputFormat) => void;
    customPrompt: string;
    setCustomPrompt: (prompt: string) => void;
}

const ScrapeFormContext = createContext<ScrapeFormContextType | undefined>(undefined);

export function ScrapeFormProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ScrapeMode>("simple");
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);

    // Simple Mode
    const [task, setTask] = useState("");
    const [useOwnProvider, setUseOwnProvider] = useState(false);

    // Advanced Mode
    const [workflow, setWorkflow] = useState<WorkflowType>("scraper-llm");
    const [llmConfig, setLlmConfig] = useState<LLMConfig>({
        provider: "openai",
        model: "gpt-4o",
        temperature: 0.7,
    });
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("json");
    const [customPrompt, setCustomPrompt] = useState("");

    return (
        <ScrapeFormContext.Provider
            value={{
                mode,
                setMode,
                url,
                setUrl,
                loading,
                setLoading,
                task,
                setTask,
                useOwnProvider,
                setUseOwnProvider,
                workflow,
                setWorkflow,
                llmConfig,
                setLlmConfig,
                outputFormat,
                setOutputFormat,
                customPrompt,
                setCustomPrompt,
            }}
        >
            {children}
        </ScrapeFormContext.Provider>
    );
}

export function useScrapeForm() {
    const context = useContext(ScrapeFormContext);
    if (context === undefined) {
        throw new Error("useScrapeForm must be used within a ScrapeFormProvider");
    }
    return context;
}
