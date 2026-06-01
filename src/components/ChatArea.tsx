import { Card } from './ui/Card';
import { Button } from './ui/Button';

export default function ChatArea() {
  return (
    <Card elevated className="flex flex-col h-full rounded-2xl md:rounded-[2rem] p-6 lg:p-8">
      <div className="text-muted-foreground mb-6 text-center text-sm font-medium">
        Start a conversation with your AI assistant
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-white/10 shadow-inner">
        <div className="bg-white/60 dark:bg-black/60 text-foreground self-start p-4 px-6 rounded-2xl rounded-bl-sm border border-white/20 shadow-sm max-w-[85%] leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
          Hi — I'm PAIVA. How can I help you today?
        </div>
        <div className="bg-gradient-to-br from-primary to-blue-600 text-white self-end p-4 px-6 rounded-2xl rounded-br-sm shadow-md max-w-[85%] leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          Please help me draft a massive UI upgrade plan.
        </div>
        <div className="bg-white/60 dark:bg-black/60 text-foreground self-start p-4 px-6 rounded-2xl rounded-bl-sm border border-white/20 shadow-sm max-w-[85%] leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          Absolutely! I'll set up a glassmorphic layout with light and dark mode toggles, sleek gradients, and responsive components.
        </div>
      </div>
      <form className="flex flex-col sm:flex-row gap-4 mt-6 lg:mt-8" onSubmit={e => e.preventDefault()}>
        <input 
          placeholder="Type your message and press Enter" 
          className="flex-1 px-6 py-4 rounded-xl border-2 border-transparent bg-black/5 dark:bg-white/10 text-foreground placeholder:text-muted-foreground outline-none focus:bg-transparent dark:focus:bg-transparent focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 shadow-inner"
        />
        <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto h-14 px-8 rounded-xl">Send</Button>
      </form>
    </Card>
  );
}