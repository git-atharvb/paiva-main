import React from 'react';
import { Rocket, Code2, Heart, Sparkles, Brain, Zap, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import paivaLogo from '../assets/paiva_logo.png';

export default function AboutView() {
  return (
    <div className="relative w-full h-full flex flex-col items-center p-6 md:p-12 overflow-y-auto magical-scrollbar">
      
      {/* Ambient glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700 my-auto py-8">
        
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-primary/10 border border-primary/30 text-primary shadow-[0_0_30px_rgba(var(--primary),0.2)] mb-4 mx-auto group">
            <Rocket size={40} strokeWidth={2.5} className="group-hover:animate-bounce transition-all duration-500" />
          </div>
          <div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50 mb-4">
              PAIVA
            </h1>
            <p className="text-primary font-bold tracking-[0.2em] uppercase text-sm md:text-base mb-8">
              Advanced AI Workspace
            </p>

            <div className="relative size-32 md:size-40 mx-auto group cursor-default">
              {/* Glow halo behind logo */}
              <div className="absolute inset-0 bg-primary/40 blur-3xl rounded-[2rem] opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none animate-pulse-glow" />
              <div className="absolute inset-0 border border-primary/20 rounded-[2rem] group-hover:border-primary/50 transition-colors duration-500" />
              <img
                src={paivaLogo}
                alt="Paiva Logo"
                className="w-full h-full object-contain rounded-[2rem] drop-shadow-2xl relative z-10 transition-all duration-700 ease-spring group-hover:scale-105 group-hover:drop-shadow-[0_0_25px_rgba(var(--primary),0.6)]"
              />
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="glass-surface border border-border/50 rounded-[2.5rem] p-8 md:p-12 shadow-xl backdrop-blur-md">
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto font-medium">
            PAIVA is a next-generation personal workspace designed to unify your digital workflow. Featuring intelligent conversational agents, dynamic task management, a smart markdown knowledge base, intuitive mathematical solvers, and seamless integrations—PAIVA acts as your ultimate digital assistant.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-surface-subtle p-6 rounded-3xl border border-border/50 flex flex-col items-center text-center gap-4 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <Code2 size={28} />
            </div>
            <h3 className="font-bold text-lg text-foreground">Modern Tech Stack</h3>
            <p className="text-sm text-muted-foreground">Built with React, Vite, Spring Boot, and powerful AI LLMs via Groq.</p>
          </div>

          <div className="glass-surface-subtle p-6 rounded-3xl border border-border/50 flex flex-col items-center text-center gap-4 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Brain size={28} />
            </div>
            <h3 className="font-bold text-lg text-foreground">Intelligence Core</h3>
            <p className="text-sm text-muted-foreground">Features intelligent context-awareness, smart calculators, and magic formatting.</p>
          </div>

          <div className="glass-surface-subtle p-6 rounded-3xl border border-border/50 flex flex-col items-center text-center gap-4 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
              <Heart size={28} />
            </div>
            <h3 className="font-bold text-lg text-foreground">Built with Passion</h3>
            <p className="text-sm text-muted-foreground">Crafted carefully with glassmorphism UI and a deep focus on user experience.</p>
          </div>
        </div>

        {/* Team Section */}
        <div className="mt-8 pt-10 border-t border-border/40 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
            <Sparkles size={16} className="text-primary" />
            Developed By
            <Sparkles size={16} className="text-primary" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <div className="group relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-card border border-primary/20 hover:border-primary/50 shadow-lg text-primary px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-default">
                <span className="text-xl font-black tracking-tight">Ananya Parbat</span>
              </div>
            </div>
            
            <span className="text-muted-foreground/30 font-light text-3xl hidden sm:block">&</span>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-card border border-primary/20 hover:border-primary/50 shadow-lg text-primary px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-default">
                <span className="text-xl font-black tracking-tight">Atharv Bowlekar</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
