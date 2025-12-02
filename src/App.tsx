import React, { useState, useCallback, useRef, useEffect } from 'react';
import { checkResume, generateInterviewQuestions, type AnalysisMetrics } from './services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// --- Worker Configuration ---
// Fix for local Vite environment: Ensure we point to a valid worker URL matching the installed version.
// We handle different export structures of pdfjs-dist here.
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// --- Icons ---
const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
);
const WandSparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M13 22 22 13" /><path d="M6 18h.01" /><path d="M10 14h.01" /><path d="M14 10h.01" /><path d="M18 6h.01" /></svg>
);
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);
const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12" /></svg>
);
const DashboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
);
const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
);
const FileCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="m9 15 2 2 4-4" /></svg>
);
const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
);
const CrosshairIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" /></svg>
);
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

// --- File Helpers ---
const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;
        
        let textContent = '';
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((item: any) => 'str' in item ? item.str : '').join(' ');
            textContent += '\n';
        }
        return textContent;
    } catch (e) {
        console.error("PDF Parsing error:", e);
        throw new Error("Failed to parse PDF. Please ensure the file is valid.");
    }
};
const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};
const extractTextFromHtml = async (file: File): Promise<string> => {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc.body.textContent || '';
};

// --- Components ---

const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center py-24">
        <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-indigo-500"></div>
            <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-2 border-b-2 border-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <div className="mt-8 space-y-2 text-center">
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse">
                Analyzing Metrics...
            </p>
            <p className="text-gray-400 text-sm">Comparing technical skills, ATS readability, and impact.</p>
        </div>
    </div>
);

// Memoized to prevent re-renders when other parts of the dashboard update
const MetricBar = React.memo(({ label, score, colorClass }: { label: string, score: number, colorClass: string }) => (
    <div className="mb-4">
        <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-300">{label}</span>
            <span className="text-sm font-medium text-white">{score}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
                className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
                style={{ width: `${score}%` }}
            ></div>
        </div>
    </div>
));

const SimpleMarkdownRenderer: React.FC<{ content: string }> = React.memo(({ content }) => {
    if (!content) return null;

    // Helper for bold text
    const renderSpans = (text: string) => {
        return text.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
             if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
                return <em key={i} className="italic text-indigo-300">{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    const lines = content.split('\n');
    return (
        <div className="space-y-2">
            {lines.map((line, i) => {
                if (line.startsWith('- ')) {
                    return <div key={i} className="flex items-start ml-2"><span className="mr-2 text-indigo-400">•</span><span className="text-gray-300">{renderSpans(line.slice(2))}</span></div>;
                }
                if (line.trim()) {
                     return <p key={i} className="text-gray-300 mb-2">{renderSpans(line)}</p>;
                }
                return <br key={i}/>
            })}
        </div>
    );
});

// --- View Components ---

const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-950 selection:bg-indigo-500/30 font-inter">
            {/* Background Elements */}
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black"></div>
            
            {/* Animated Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1.5s'}}></div>
            <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-pink-600/20 rounded-full blur-[80px] animate-bounce" style={{animationDuration: '8s'}}></div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none"></div>

            {/* Brand Logo - Top Left */}
            <div className="absolute top-6 left-6 z-50 flex items-center space-x-3 animate-fade-in">
                 <div className="p-2 bg-indigo-600/90 backdrop-blur-sm rounded-lg shadow-lg shadow-indigo-500/20 border border-white/10">
                    <FileCheckIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                    AI Resume Checker
                </span>
            </div>

            <div className="relative z-10 container mx-auto px-6 text-center max-w-6xl">
                
                {/* Hero Badge */}
                <div className="mt-10 inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 backdrop-blur-md animate-fade-in hover:bg-white/10 transition-colors">
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
  </span>
  <span className="text-sm font-medium text-gray-300 tracking-wide">
    AI-Powered Resume Optimization
  </span>
</div>


                {/* Hero Title */}
                <h1 className="mt-12 text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-8 leading-tight drop-shadow-2xl animate-fade-in">
  Land Your Dream <br />
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
    Tech Role
  </span>
</h1>

                {/* Hero Subtitle */}
                <p
  className="text-lg md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light animate-fade-in"
  style={{ animationDelay: "0.2s" }}
>
  An AI-powered resume analysis platform that provides ATS optimization, job-description matching, and interview preparation insights.
</p>


                {/* CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24 animate-fade-in" style={{animationDelay: '0.3s'}}>
                    <button 
                        onClick={onStart}
                        className="group relative px-10 py-5 bg-white text-gray-950 font-bold text-xl rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] ring-offset-2 ring-offset-black focus:ring-2 focus:ring-white"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                        <span className="relative flex items-center">
                            Start Analysing
                            <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </button>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>• No sign-up required</span>
                        <span>• 100% Privacy</span>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in" style={{animationDelay: '0.4s'}}>
                    {/* Feature 1: Main */}
                    <div className="md:col-span-8 p-8 rounded-3xl bg-gray-900/40 border border-white/10 backdrop-blur-md hover:border-indigo-500/30 transition-all duration-300 text-left group">
                        <div className="h-12 w-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <WandSparklesIcon className="h-6 w-6 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">AI Match Score & Analysis</h3>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            We use advanced semantic understanding to score your resume against the JD. We don't just count keywords; we analyze context, impact, and relevancy to give you a true compatibility score.
                        </p>
                    </div>

                    {/* Feature 2: ATS */}
                    <div className="md:col-span-4 p-8 rounded-3xl bg-gray-900/40 border border-white/10 backdrop-blur-md hover:border-emerald-500/30 transition-all duration-300 text-left group">
                         <div className="h-12 w-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <CheckIcon className="h-6 w-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">ATS Optimized</h3>
                        <p className="text-gray-400">Identify formatting issues that confuse applicant tracking systems.</p>
                    </div>

                    {/* Feature 3: Formats */}
                    <div className="md:col-span-4 p-8 rounded-3xl bg-gray-900/40 border border-white/10 backdrop-blur-md hover:border-purple-500/30 transition-all duration-300 text-left group">
                         <div className="h-12 w-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <FileTextIcon className="h-6 w-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Multi-Format</h3>
                        <p className="text-gray-400">Support for PDF, DOCX, TXT, LaTeX, and Markdown resumes.</p>
                    </div>

                    {/* Feature 4: Interview */}
                    <div className="md:col-span-8 p-8 rounded-3xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/10 backdrop-blur-md hover:border-pink-500/30 transition-all duration-300 text-left group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-pink-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="h-12 w-12 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <DashboardIcon className="h-6 w-6 text-pink-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Targeted Interview Prep</h3>
                            <p className="text-gray-400 text-lg">
                                Stop preparing generic answers. Our AI identifies the specific gaps in your resume relative to the JD and generates custom interview questions to help you address them.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                    <p>© 2024 AI Resume Checker</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MainApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // State
    const [resume, setResume] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Result Data
    const [analysisResult, setAnalysisResult] = useState<AnalysisMetrics | null>(null);
    const [interviewQs, setInterviewQs] = useState<string | null>(null);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'analysis' | 'interview'>('analysis');
    const [loadingQs, setLoadingQs] = useState(false);
    const [copied, setCopied] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Actions ---

    useEffect(() => {
        const configureWorker = () => {
            try {
                if (pdfjs && typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
                    const version = pdfjs.version || '4.4.168'; 
                    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.mjs`;
                }
            } catch (e) {
                console.warn("Failed to configure PDF worker:", e);
            }
        };
        configureWorker();
    }, []);

    const processFile = async (file: File) => {
        setIsParsing(true);
        setError('');
        setFileName(null);
        setResume('');

        try {
            let text = '';
            const fileNameLower = file.name.toLowerCase();
            const extension = fileNameLower.split('.').pop();

            if (fileNameLower.endsWith('.pdf')) {
                text = await extractTextFromPdf(file);
            } else if (fileNameLower.endsWith('.docx')) {
                text = await extractTextFromDocx(file);
            } else if (fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.md') || fileNameLower.endsWith('.tex')) {
                text = await file.text();
            } else if (fileNameLower.endsWith('.html') || fileNameLower.endsWith('.htm')) {
                text = await extractTextFromHtml(file);
            } else {
                throw new Error(`Unsupported file type${extension ? ` (.${extension})` : ''}.`);
            }
            
            if (!text.trim()) {
                throw new Error('Could not extract text. File might be empty or image-based.');
            }

            setResume(text);
            setFileName(file.name);
        } catch (e) {
            console.error('Failed to process file:', e);
            setError(`Error: ${e instanceof Error ? e.message : 'Unknown error.'}`);
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAnalyze = async () => {
        if (!resume || !jobDescription) return;
        setIsLoading(true);
        setError('');
        setAnalysisResult(null);
        setInterviewQs(null);
        setActiveTab('analysis');

        try {
            const metrics = await checkResume(resume, jobDescription);
            setAnalysisResult(metrics);
        } catch (err) {
            setError('Analysis failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateQs = async () => {
        if (!resume || !jobDescription) return;
        setLoadingQs(true);
        setActiveTab('interview');
        try {
            const qs = await generateInterviewQuestions(resume, jobDescription);
            setInterviewQs(qs);
        } catch (e) {
            setInterviewQs('Failed to generate questions.');
        } finally {
            setLoadingQs(false);
        }
    };

    const handleCopy = () => {
        if (analysisResult) {
            // Reconstruct a text format for copying
            const text = `Match Score: ${analysisResult.overallScore}%\nSummary: ${analysisResult.summary}\n\nStrengths:\n${analysisResult.strengths.map(s => `- ${s}`).join('\n')}\n\nImprovements:\n${analysisResult.improvements.map(s => `- ${s}`).join('\n')}`;
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleReset = () => {
        setAnalysisResult(null);
        setInterviewQs(null);
        window.scrollTo(0, 0);
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isLoading || isParsing) return;
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, [isLoading, isParsing]);

    // If result exists, show Result View
    if (analysisResult) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in pb-24">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={onBack} 
                            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                            title="Back to Home"
                        >
                            <HomeIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleReset} className="flex items-center text-gray-400 hover:text-white transition-colors group">
                            <RefreshIcon className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform" />
                            New Analysis
                        </button>
                    </div>
                    <button 
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors border border-white/5" 
                        onClick={handleCopy}
                    >
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                    </button>
                </div>

                <div className="bg-gray-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="border-b border-white/5 px-8 py-6 bg-gray-900/50">
                        <h1 className="text-2xl font-bold text-white mb-2">Analysis Report</h1>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                             <span>{fileName || 'Pasted Resume'}</span>
                             <span>vs</span>
                             <span className="truncate max-w-[200px]">{jobDescription.substring(0, 30)}...</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/5 bg-gray-900/30">
                        <button 
                            onClick={() => setActiveTab('analysis')}
                            className={`flex-1 py-4 text-center font-medium transition-colors relative ${activeTab === 'analysis' ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Metrics & Analysis
                            {activeTab === 'analysis' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
                        </button>
                        <button 
                            onClick={() => { setActiveTab('interview'); if(!interviewQs && !loadingQs) handleGenerateQs(); }}
                            className={`flex-1 py-4 text-center font-medium transition-colors relative ${activeTab === 'interview' ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Interview Prep
                            {activeTab === 'interview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
                        </button>
                    </div>

                    <div className="p-8 min-h-[400px]">
                        {activeTab === 'analysis' ? (
                            <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-8">
                                
                                {/* Left Column: Visual Metrics */}
                                <div className="lg:col-span-4 space-y-8">
                                    {/* Overall Score */}
                                    <div className="bg-gray-800/40 rounded-xl p-6 border border-white/5 flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-bold text-white mb-4">Overall Match</h3>
                                        <div className="relative h-40 w-40 flex items-center justify-center">
                                             <svg className="w-full h-full transform -rotate-180">
                                                <circle cx="80" cy="80" r="70" fill="none" stroke="#374151" strokeWidth="12" strokeDasharray="220 220" />
                                                <circle cx="80" cy="80" r="70" fill="none" stroke="#6366f1" strokeWidth="12" strokeDasharray="220 220" strokeDashoffset={220 - (220 * analysisResult.overallScore) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                                            </svg>
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/3 text-center">
                                                <span className="text-4xl font-bold text-white block">{analysisResult.overallScore}</span>
                                                <span className="text-xs text-gray-400">/ 100</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Metrics */}
                                    <div className="bg-gray-800/40 rounded-xl p-6 border border-white/5">
                                        <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-6">Breakdown</h3>
                                        <MetricBar label="Technical Match" score={analysisResult.technicalMatch} colorClass="bg-emerald-500" />
                                        <MetricBar label="Soft Skills & Culture" score={analysisResult.softSkillsMatch} colorClass="bg-purple-500" />
                                        <MetricBar label="ATS Compatibility" score={analysisResult.atsCompatibility} colorClass="bg-blue-500" />
                                        <MetricBar label="Impact (Result Oriented)" score={analysisResult.impactScore} colorClass="bg-amber-500" />
                                    </div>

                                    {/* Keywords Cloud */}
                                    <div className="bg-gray-800/40 rounded-xl p-6 border border-white/5">
                                        <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-4">Keyword Analysis</h3>
                                        
                                        <div className="mb-4">
                                            <p className="text-xs text-emerald-400 mb-2 font-bold flex items-center"><CheckIcon className="w-3 h-3 mr-1"/> Matched</p>
                                            <div className="flex flex-wrap gap-2">
                                                {analysisResult.matchedKeywords.map((k, i) => (
                                                    <span key={i} className="px-2 py-1 text-xs rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{k}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-rose-400 mb-2 font-bold flex items-center"><CrosshairIcon className="w-3 h-3 mr-1"/> Missing / Recommended</p>
                                            <div className="flex flex-wrap gap-2">
                                                {analysisResult.missingKeywords.map((k, i) => (
                                                    <span key={i} className="px-2 py-1 text-xs rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">{k}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Text Analysis */}
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-xl">
                                        <h3 className="text-indigo-300 font-bold mb-2 flex items-center"><StarIcon className="w-4 h-4 mr-2"/> Executive Summary</h3>
                                        <p className="text-gray-300 leading-relaxed">{analysisResult.summary}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></span>
                                            Key Strengths
                                        </h3>
                                        <div className="bg-gray-800/20 p-6 rounded-xl border border-white/5 space-y-3">
                                            {analysisResult.strengths.map((item, i) => (
                                                <div key={i} className="flex items-start">
                                                    <span className="mt-1.5 mr-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500"></span>
                                                    <p className="text-gray-300">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                            <span className="w-1.5 h-6 bg-amber-500 rounded-full mr-3"></span>
                                            Areas for Improvement
                                        </h3>
                                        <div className="bg-gray-800/20 p-6 rounded-xl border border-white/5 space-y-3">
                                            {analysisResult.improvements.map((item, i) => (
                                                <div key={i} className="flex items-start">
                                                    <span className="mt-1.5 mr-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"></span>
                                                    <p className="text-gray-300">{item}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                {!interviewQs && !loadingQs && (
                                    <div className="text-center py-12">
                                        <h3 className="text-xl font-bold text-white mb-4">Generate Targeted Interview Questions</h3>
                                        <p className="text-gray-400 mb-6">AI will generate 5 questions based on the gaps found in your resume.</p>
                                        <button onClick={handleGenerateQs} className="px-6 py-3 bg-indigo-600 rounded-full text-white font-bold hover:bg-indigo-500 transition-colors">Generate Questions</button>
                                    </div>
                                )}
                                {loadingQs && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                                        <p className="text-indigo-400 animate-pulse">Designing interview script...</p>
                                    </div>
                                )}
                                {interviewQs && (
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-6">Recommended Interview Questions</h3>
                                        <div className="prose prose-invert max-w-none">
                                            <SimpleMarkdownRenderer content={interviewQs} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Default: Input View
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center space-x-4">
                     {/* Back Button */}
                    <button 
                        onClick={onBack}
                        className="p-2 bg-gray-900 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors group"
                        title="Back to Welcome Screen"
                    >
                        <HomeIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
                            <FileCheckIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            AI Resume Checker
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Resume Input */}
                 <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">1. Upload Resume</label>
                    <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                            isDragging 
                            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' 
                            : 'border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800/50 bg-gray-900/50'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) processFile(file);
                            }} 
                            className="hidden" 
                            accept=".pdf,.docx,.txt,.md,.tex,.html"
                        />
                        
                        {isParsing ? (
                            <div className="py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
                                <p className="text-indigo-400">Extracting text...</p>
                            </div>
                        ) : (
                            <div className="space-y-4 pointer-events-none">
                                <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                                    <UploadIcon className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-white">
                                        {fileName ? fileName : "Drop your resume here"}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {fileName ? "Ready to analyze" : "Click to browse or drag file here"}
                                    </p>
                                </div>
                                {!fileName && (
                                    <div className="inline-block px-4 py-2 bg-gray-800 rounded-lg text-sm text-indigo-300 font-medium">
                                        Browse Files
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Text Area Fallback */}
                     <div className="relative">
                        <div className="absolute top-3 right-3 text-xs text-gray-500 pointer-events-none">
                            {resume.length > 0 ? `${resume.length} chars` : ''}
                        </div>
                        <textarea
                            className="w-full h-40 bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all scrollbar-thin scrollbar-thumb-gray-700 resize-none"
                            placeholder="Or paste resume text here..."
                            value={resume}
                            onChange={(e) => setResume(e.target.value)}
                        />
                    </div>
                </div>

                {/* JD Input */}
                <div className="space-y-4">
                     <label className="block text-sm font-medium text-gray-300">2. Job Description</label>
                     <div className="relative h-full">
                        <textarea
                            className="w-full h-[calc(100%-2rem)] min-h-[360px] bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all scrollbar-thin scrollbar-thumb-gray-700 resize-none"
                            placeholder="Paste the job description here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                    </div>
                </div>
            </div>

             {/* Action Bar */}
             <div className="mt-12 flex flex-col items-center justify-center space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-3 rounded-lg text-sm flex items-center animate-fade-in">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}
                
                <button
                    onClick={handleAnalyze}
                    disabled={!resume || !jobDescription || isLoading}
                    className={`
                        group relative w-full max-w-md py-4 rounded-xl font-bold text-lg shadow-2xl transition-all
                        ${(!resume || !jobDescription) 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-[1.02] hover:shadow-indigo-500/25'
                        }
                    `}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                            Analyzing...
                        </div>
                    ) : (
                        <span className="flex items-center justify-center">
                            <WandSparklesIcon className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                            Run Analysis
                        </span>
                    )}
                </button>
            
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            )}
        </div>
    );
};

// Root Component
const App = () => {
    const [started, setStarted] = useState(false);

    if (!started) {
        return <WelcomeScreen onStart={() => setStarted(true)} />;
    }

    return <MainApp onBack={() => setStarted(false)} />;
};

export default App;