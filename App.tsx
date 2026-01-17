
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { HashRouter } from 'react-router-dom';
import { 
  Send, ArrowLeft, ExternalLink, Sparkles, Book, Trash2, 
  Quote, Search, X
} from 'lucide-react';
import { CHAPTERS, GITA_PDF_URL, GITA_QUOTES } from './constants';
import { ChatMessage, View } from './types';
import { sendGitaQuestion } from './services/geminiService';
import ChapterCard from './components/ChapterCard';
import BottomNav from './components/BottomNav';
import { PeacockFeather, PeacockBackground } from './components/PeacockFeather';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const dailyQuote = useMemo(() => {
    const today = new Date();
    const index = (today.getFullYear() + today.getMonth() + today.getDate()) % GITA_QUOTES.length;
    return GITA_QUOTES[index];
  }, []);

  const filteredChapters = useMemo(() => {
    return CHAPTERS.filter(chap => 
      chap.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chap.sanskritName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chap.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'model',
    text: "Namaste! I am your Gita AI Assistant. Ask me anything about your studies, focus, or life duties."
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentView]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const history = messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendGitaQuestion(userMsg.text, history);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text, citations: response.citations }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error connecting to AI.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHome = () => (
    <div className="p-4 pb-24 max-w-3xl mx-auto relative">
      <PeacockBackground />
      <header className="mb-8 text-center pt-8">
        <div className="flex justify-center mb-4">
           <PeacockFeather className="h-16 w-16 drop-shadow-md" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-krishna-900 mb-2">Gita AI Assistant</h1>
        <p className="text-krishna-700">Wisdom for the modern student</p>
      </header>

      <div className="mb-6 bg-gradient-to-br from-peacock-50 to-white rounded-2xl p-6 shadow-sm border border-peacock-100 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-peacock-600 uppercase tracking-widest flex items-center">Daily Wisdom</span>
            <span className="text-[10px] text-krishna-400 font-medium">Chapter Quote</span>
          </div>
          
          {/* Devnagari Script */}
          <p className="text-krishna-950 font-serif text-2xl leading-relaxed mb-2 text-center">
            {dailyQuote.devnagari}
          </p>
          
          {/* Transliteration */}
          <p className="text-krishna-800 font-serif italic text-base leading-relaxed mb-4 text-center opacity-80">
            "{dailyQuote.verse}"
          </p>

          <p className="text-krishna-700 text-sm mb-4 border-t border-peacock-100 pt-4 italic">
            {dailyQuote.translation}
          </p>

          <div className="bg-peacock-600/5 p-3 rounded-xl border border-peacock-100/50">
            <p className="text-peacock-800 text-xs font-medium"><span className="font-bold">Student Lesson:</span> {dailyQuote.lesson}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-krishna-400 w-4 h-4" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Karma, Focus, Duty..."
          className="w-full bg-white border border-krishna-100 rounded-full py-3 pl-10 pr-10 text-sm focus:ring-2 focus:ring-peacock-400 outline-none shadow-sm"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChapters.map(chapter => (
          <ChapterCard key={chapter.id} chapter={chapter} onClick={(id) => { setSelectedChapterId(id); setCurrentView('chapter'); window.scrollTo(0,0); }} />
        ))}
      </div>

      <footer className="mt-12 text-center pb-8 opacity-40">
        <p className="text-[10px] text-krishna-700 uppercase tracking-widest">Gita AI Assistant • 2025</p>
        <button onClick={() => setCurrentView('privacy')} className="text-[10px] underline mt-2">Privacy Policy</button>
      </footer>
    </div>
  );

  return (
    <HashRouter>
      <div className="min-h-screen bg-krishna-50 font-sans text-krishna-900 selection:bg-peacock-200 selection:text-peacock-900">
        <main className="min-h-screen">
          {currentView === 'home' && renderHome()}
          {currentView === 'chat' && (
             <div className="flex flex-col h-screen bg-krishna-50 pb-[64px]">
                <div className="bg-white border-b border-krishna-200 p-4 shadow-sm z-10 flex items-center justify-between">
                  <div className="flex items-center">
                    <Sparkles className="w-5 h-5 text-peacock-700 mr-2" />
                    <h2 className="font-bold text-krishna-900">Ask Gita AI</h2>
                  </div>
                  <button onClick={() => setMessages([{ id: 'welcome', role: 'model', text: "Namaste! How can I help?" }])}><Trash2 className="w-4 h-4 text-krishna-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl mx-auto w-full">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-krishna-700 text-white rounded-tr-none' : 'bg-white text-krishna-900 border border-krishna-100 rounded-tl-none'}`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        {msg.citations && <div className="mt-2 text-[10px] opacity-60">Source: {msg.citations[0]}</div>}
                      </div>
                    </div>
                  ))}
                  {isLoading && <div className="text-xs text-krishna-400 animate-pulse">Assistant is thinking...</div>}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white border-t border-krishna-200">
                  <div className="max-w-3xl mx-auto relative flex items-center">
                    <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type your question..." className="w-full pl-4 pr-12 py-3 rounded-full border border-krishna-300 outline-none" disabled={isLoading} />
                    <button onClick={handleSendMessage} disabled={!input.trim() || isLoading} className="absolute right-2 p-2 bg-peacock-600 text-white rounded-full"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
             </div>
          )}
          {currentView === 'resources' && (
            <div className="p-4 pt-8 max-w-3xl mx-auto text-center">
              <h2 className="text-xl font-bold mb-4">Study Resources</h2>
              <a href={GITA_PDF_URL} target="_blank" rel="noreferrer" className="p-4 bg-white border border-krishna-100 rounded-xl flex items-center justify-center space-x-2 shadow-sm hover:shadow-md transition-shadow">
                <Book className="w-5 h-5 text-peacock-600" />
                <span>Open Hindi Gita PDF</span>
              </a>
            </div>
          )}
          {currentView === 'privacy' && (
            <div className="p-8 max-w-3xl mx-auto bg-white min-h-screen">
              <button onClick={() => setCurrentView('home')} className="mb-4 text-krishna-500 flex items-center hover:text-krishna-700">
                <ArrowLeft className="w-4 h-4 mr-2"/>Back
              </button>
              <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-krishna-700 leading-relaxed">
                Gita AI Assistant is designed for students. We do not collect, store, or share any personal information. 
                Your chat sessions are strictly local to your browser and are not saved on any remote servers. 
                AI responses are generated via the Google Gemini API using the queries you provide.
              </p>
            </div>
          )}
          {currentView === 'chapter' && (
            <div className="p-4 max-w-3xl mx-auto">
               <button onClick={() => setCurrentView('home')} className="mb-4 text-krishna-500 flex items-center hover:text-krishna-700">
                 <ArrowLeft className="w-4 h-4 mr-2"/>Back
               </button>
               <div className="bg-white p-6 rounded-2xl shadow-lg border border-krishna-100">
                 <h2 className="text-2xl font-serif font-bold text-krishna-900">{CHAPTERS.find(c => c.id === selectedChapterId)?.sanskritName}</h2>
                 <h3 className="text-peacock-600 font-medium italic mt-1">{CHAPTERS.find(c => c.id === selectedChapterId)?.englishName}</h3>
                 <p className="mt-4 text-krishna-800 leading-relaxed">{CHAPTERS.find(c => c.id === selectedChapterId)?.summary}</p>
                 <a href={CHAPTERS.find(c => c.id === selectedChapterId)?.detailedUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center text-peacock-600 font-bold hover:underline">
                   Read Full Chapter <ExternalLink className="ml-2 w-4 h-4"/>
                 </a>
               </div>
            </div>
          )}
        </main>
        {currentView !== 'privacy' && <BottomNav currentView={currentView} setView={setCurrentView} />}
      </div>
    </HashRouter>
  );
};

export default App;
