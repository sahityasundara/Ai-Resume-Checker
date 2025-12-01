
export interface AnalysisRecord {
    id: string;
    date: string;
    fileName: string;
    jobTitle: string; // Extracted or first few words of JD
    score: string;
    content: string;
    resumeText: string;
    jdText: string;
}

const STORAGE_KEY = 'resume_analyzer_history';

// Safe UUID generation that falls back if crypto.randomUUID is not available
const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const saveAnalysis = (record: Omit<AnalysisRecord, 'id' | 'date'>): string => {
    const history = getHistory();
    const newRecord: AnalysisRecord = {
        ...record,
        id: generateId(),
        date: new Date().toISOString(),
    };
    
    // Prepend to keep newest first
    const updatedHistory = [newRecord, ...history];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return newRecord.id;
};

export const getHistory = (): AnalysisRecord[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse history", e);
        return [];
    }
};

export const getAnalysisById = (id: string): AnalysisRecord | undefined => {
    const history = getHistory();
    return history.find(r => r.id === id);
};

export const deleteAnalysis = (id: string) => {
    const history = getHistory();
    const updated = history.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};