const conversations = [
  { id: '1', title: '⚡ Personal Planner' },
  { id: '2', title: '🔍 Research Assistant' },
  { id: '3', title: '💻 Code Helper' },
]

export default function Sidebar() {
  return (
    <aside className="paiva-sidebar">
      <div className="sidebar-top">Conversations</div>
      <ul className="conv-list">
        {conversations.map(c => (
          <li key={c.id} className="conv-item">
            {c.title}
          </li>
        ))}
      </ul>
    </aside>
  )
}