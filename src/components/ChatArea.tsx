export default function ChatArea() {
  return (
    <section className="paiva-chat">
      <div className="chat-intro">Start a conversation with your AI assistant</div>
      <div className="chat-window">
        <div className="msg assistant">Hi — I'm PAIVA. How can I help you today?</div>
        <div className="msg user">Please help me draft a massive UI upgrade plan.</div>
        <div className="msg assistant">Absolutely! I'll set up a glassmorphic layout with light and dark mode toggles, sleek gradients, and responsive components.</div>
      </div>
      <form className="chat-input" onSubmit={e => e.preventDefault()}>
        <input placeholder="Type your message and press Enter" />
        <button type="submit">Send</button>
      </form>
    </section>
  )
}