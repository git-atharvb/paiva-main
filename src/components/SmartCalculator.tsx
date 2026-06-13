import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import { Calculator, Wand2, Loader2, Trash2, X, Bot, Download, Beaker } from 'lucide-react';
import { utilityService } from '../services/utilityService';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function SmartCalculator() {
  // Load initial state from local storage
  const [text, setText] = useState(() => {
    return localStorage.getItem('paiva_calc_memory') || '';
  });
  const [isSolving, setIsSolving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isScientific, setIsScientific] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [aiSolution, setAiSolution] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save text to local storage
  useEffect(() => {
    localStorage.setItem('paiva_calc_memory', text);
  }, [text]);

  useEffect(() => {
    const lines = text.split('\n');
    const newResults: string[] = [];
    const parser = math.parser();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        newResults.push('');
        continue;
      }

      try {
        const res = parser.evaluate(line);
        if (typeof res === 'function') {
          newResults.push('f(x)');
        } else if (res === undefined) {
          newResults.push('');
        } else {
          newResults.push(math.format(res, { precision: 14 }));
        }
      } catch (e) {
        if (line.length > 15 && /[a-zA-Z]{5,}/.test(line) && !line.includes('=')) {
          newResults.push('Use Magic Solve 👉');
        } else {
          newResults.push('');
        }
      }
    }
    setResults(newResults);
  }, [text]);

  const handleMagicSolve = async () => {
    if (!text.trim()) {
      toast.error('Enter a problem to solve first!');
      return;
    }
    setIsSolving(true);
    try {
      const prompt = `Solve the following math or logic problem step-by-step. Keep it clear, concise, and professional. You have access to the full canvas history as context.\n\nCanvas:\n"${text}"`;
      const response = await utilityService.generateText(prompt);
      setAiSolution(response);
      toast.success('Magic solve complete!');
      
      // Scroll to bottom to show AI solution
      setTimeout(() => {
        const container = document.getElementById('calc-scroll-container');
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (e) {
      toast.error('Failed to solve problem.');
    } finally {
      setIsSolving(false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('calc-scroll-container');
    if (!element) return;
    setIsExporting(true);
    try {
      // Temporarily expand height to capture everything if scrollable
      const originalHeight = element.style.height;
      element.style.height = 'auto';
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      element.style.height = originalHeight;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('SmartCalculator.pdf');
      toast.success('Exported to PDF!');
    } catch (e) {
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const resultsPane = document.getElementById('calculator-results');
    if (resultsPane) {
      resultsPane.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const insertText = (str: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newText = text.substring(0, start) + str + text.substring(end);
    setText(newText);
    
    // Move cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + str.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const KeypadButton = ({ label, value, className = '' }: { label: React.ReactNode, value: string, className?: string }) => (
    <button
      onClick={() => insertText(value)}
      className={`bg-card/40 hover:bg-primary/20 active:scale-95 border border-border/50 rounded-xl flex items-center justify-center font-semibold text-lg transition-all shadow-sm hover:shadow-md ${className}`}
    >
      {label}
    </button>
  );

  return (
    <section className="h-full flex flex-col p-4 md:p-6 text-foreground overflow-hidden">
      <div className="w-full flex items-center justify-between mb-6 shrink-0 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <Calculator size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Smart Calculator</h1>
            <p className="text-muted-foreground text-sm font-medium">Interactive notebook & AI word problem solver</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary flex items-center gap-2 font-semibold transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} strokeWidth={2.5} />}
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button
            onClick={() => { setText(''); setAiSolution(null); }}
            className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 font-semibold transition-colors"
          >
            <Trash2 size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Clear</span>
          </button>
          <button
            onClick={handleMagicSolve}
            disabled={isSolving || !text.trim()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 font-semibold transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50"
          >
            {isSolving ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} strokeWidth={2.5} />}
            <span className="hidden sm:inline">Magic Solve</span>
          </button>
        </div>
      </div>

      <div id="calc-scroll-container" className="flex-1 overflow-y-auto magical-scrollbar rounded-3xl pb-10">
        {/* Top Area: Math Notebook and Keypad */}
        <div className="flex flex-col lg:flex-row gap-6 h-[500px] shrink-0">
          {/* Left: Math Notebook Canvas */}
          <div className="flex-1 min-h-[300px] h-full bg-background/50 backdrop-blur-md border border-border/50 rounded-3xl overflow-hidden shadow-sm flex relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onScroll={handleSyncScroll}
              placeholder="Start typing math or convert units!&#10;E.g.&#10;Budget = 5000&#10;Rent = 1500&#10;5 cm to inch&#10;120 km/h to mph"
              className="w-2/3 h-full p-6 text-[17px] leading-[1.8] bg-transparent border-none outline-none resize-none magical-scrollbar z-10"
              spellCheck="false"
            />
            
            <div className="w-1/3 bg-secondary/20 border-l border-border/40 h-full">
              <div 
                id="calculator-results"
                className="w-full h-full p-6 text-[17px] leading-[1.8] text-primary font-mono overflow-y-auto magical-scrollbar pointer-events-none text-right"
              >
                {results.map((res, i) => (
                  <div key={i} className="min-h-[1.8em]">
                    {res && <span className="opacity-0 animate-[fade-in_0.2s_ease-out_forwards] select-all pointer-events-auto">{res}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Visual Keypad */}
          <div className="w-full lg:w-[320px] shrink-0 bg-background/40 backdrop-blur-md border border-border/40 rounded-3xl p-5 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Keypad</span>
              <button 
                onClick={() => setIsScientific(!isScientific)}
                className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs font-bold ${isScientific ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-card/40 border-border/50 text-muted-foreground hover:bg-secondary'}`}
              >
                <Beaker size={14} />
                SCI
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-3 flex-1">
              {isScientific && (
                <>
                  <KeypadButton label="sin" value="sin(" className="text-indigo-500 text-sm" />
                  <KeypadButton label="cos" value="cos(" className="text-indigo-500 text-sm" />
                  <KeypadButton label="tan" value="tan(" className="text-indigo-500 text-sm" />
                  <KeypadButton label="log" value="log(" className="text-indigo-500 text-sm" />
                  
                  <KeypadButton label="√" value="sqrt(" className="text-indigo-500 text-sm" />
                  <KeypadButton label="x²" value="^2" className="text-indigo-500 text-sm" />
                  <KeypadButton label="xʸ" value="^" className="text-indigo-500 text-sm" />
                  <KeypadButton label="π" value="pi" className="text-indigo-500 text-sm" />
                </>
              )}
              
              <button
                onClick={() => { setText(''); textareaRef.current?.focus(); }}
                className="bg-card/40 hover:bg-destructive/10 active:scale-95 border border-border/50 rounded-xl flex items-center justify-center font-semibold text-lg transition-all shadow-sm hover:shadow-md text-destructive col-span-2"
              >
                C
              </button>
              <KeypadButton label="(" value="(" className="text-primary" />
              <KeypadButton label=")" value=")" className="text-primary" />
              
              <KeypadButton label="7" value="7" />
              <KeypadButton label="8" value="8" />
              <KeypadButton label="9" value="9" />
              <KeypadButton label="÷" value="/" className="text-primary" />
              
              <KeypadButton label="4" value="4" />
              <KeypadButton label="5" value="5" />
              <KeypadButton label="6" value="6" />
              <KeypadButton label="×" value="*" className="text-primary" />
              
              <KeypadButton label="1" value="1" />
              <KeypadButton label="2" value="2" />
              <KeypadButton label="3" value="3" />
              <KeypadButton label="−" value="-" className="text-primary" />
              
              <KeypadButton label="0" value="0" className="col-span-2" />
              <KeypadButton label="." value="." />
              <KeypadButton label="+" value="+" className="text-primary" />

              <button 
                onClick={() => insertText('\n')} 
                className="col-span-4 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 border border-primary/50 rounded-xl flex items-center justify-center font-semibold text-lg transition-all shadow-sm"
              >
                Enter ↵
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Area: AI Solution Card */}
        {aiSolution && (
          <div className="mt-6 bg-card/60 backdrop-blur-md border border-primary/20 rounded-3xl p-8 relative shadow-[0_8px_30px_rgba(var(--primary),0.1)]">
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-primary">
                <Bot size={28} className="drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                <h3 className="text-xl font-bold">Magic Solution</h3>
              </div>
              <button 
                onClick={() => setAiSolution(null)}
                className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-colors relative z-10"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="prose prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-li:text-foreground max-w-none text-[17px] leading-relaxed relative z-10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiSolution}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
