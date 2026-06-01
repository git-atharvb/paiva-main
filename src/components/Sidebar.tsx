import { Card } from './ui/Card';

const conversations = [
  { id: '1', title: '⚡ Personal Planner' },
  { id: '2', title: '🔍 Research Assistant' },
  { id: '3', title: '💻 Code Helper' },
];

export default function Sidebar() {
  return (
    <Card elevated className="h-full p-6 flex flex-col rounded-2xl md:rounded-[2rem]">
      <div className="font-extrabold mb-6 text-muted-foreground text-xs uppercase tracking-widest">
        Conversations
      </div>
      <ul className="list-none flex flex-col gap-3 m-0 p-0">
        {conversations.map((c, i) => (
          <li 
            key={c.id} 
            className="px-5 py-4 rounded-xl cursor-pointer text-foreground font-semibold text-sm bg-black/5 dark:bg-white/5 border border-transparent transition-all duration-300 hover:bg-white dark:hover:bg-black/40 hover:border-primary hover:text-primary hover:translate-x-2 shadow-sm hover:shadow-md animate-in slide-in-from-left-4 fade-in"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
          >
            {c.title}
          </li>
        ))}
      </ul>
    </Card>
  );
}