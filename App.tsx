
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { HashRouter } from 'react-router-dom';
import { 
  Send, ArrowLeft, ExternalLink, Sparkles, Book, Trash2, 
  Quote, Search, X, Youtube, Globe, FileText, Music, Heart
} from 'lucide-react';
import { CHAPTERS, GITA_PDF_URL, GITA_QUOTES, STUDY_RESOURCES } from './constants';
import { ChatMessage, View, StudyResource } from './types';
import { sendGitaQuestion } from './services/geminiService';
import ChapterCard from './components/ChapterCard';
import BottomNav from './components/BottomNav';
import { PeacockFeather, PeacockBackground } from './components/PeacockFeather';

const CHAT_STORAGE_KEY = 'gita_chat_history_v1';

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

  // Load chat history from localStorage on initialization
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [{
      id: 'welcome',
      role: 'model',
      text: "Namaste! I am Krishna. Ask me anything about your studies, focus, or life duties."
    }];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync chat history to localStorage
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

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
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm having trouble connecting right now. Please try again.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Do you want to clear your conversation history?")) {
      const welcomeMsg: ChatMessage = { id: 'welcome', role: 'model', text: "Namaste! I am Krishna. Ask me anything about your studies, focus, or life duties." };
      setMessages([welcomeMsg]);
    }
  };

  const getResourceIcon = (type: StudyResource['type']) => {
    switch(type) {
      case 'video': return <Youtube className="w-6 h-6 text-red-500" />;
      case 'book': return <Book className="w-6 h-6 text-peacock-700" />;
      case 'pdf': return <FileText className="w-6 h-6 text-blue-600" />;
      case 'web': return <Globe className="w-6 h-6 text-emerald-600" />;
      default: return <ExternalLink className="w-6 h-6 text-krishna-400" />;
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
                    <h2 className="font-bold text-krishna-900">Ask Krishna</h2>
                  </div>
                  <button onClick={handleClearChat} className="p-2 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4 text-krishna-400 hover:text-red-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl mx-auto w-full">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-krishna-700 text-white rounded-tr-none' : 'bg-white text-krishna-900 border border-krishna-100 rounded-tl-none'}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-krishna-50">
                            <p className="text-[9px] uppercase tracking-widest font-bold text-peacock-600 mb-1">Sources</p>
                            <div className="flex flex-wrap gap-2">
                              {msg.citations.map((url, idx) => (
                                <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-[10px] text-peacock-700 hover:underline flex items-center">
                                  <ExternalLink className="w-2 h-2 mr-1" /> Reference {idx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-krishna-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-peacock-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-peacock-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-peacock-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white border-t border-krishna-200">
                  <div className="max-w-3xl mx-auto relative flex items-center">
                    <input 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                      placeholder="Ask Krishna for guidance..." 
                      className="w-full pl-4 pr-12 py-3 rounded-full border border-krishna-300 focus:border-peacock-500 focus:ring-1 focus:ring-peacock-500 outline-none transition-all" 
                      disabled={isLoading} 
                    />
                    <button 
                      onClick={handleSendMessage} 
                      disabled={!input.trim() || isLoading} 
                      className="absolute right-2 p-2 bg-peacock-600 text-white rounded-full disabled:opacity-50 disabled:bg-krishna-300 transition-all hover:bg-peacock-700 active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
             </div>
          )}
          {currentView === 'resources' && (
            <div className="p-4 pt-8 pb-24 max-w-3xl mx-auto">
              <header className="text-center mb-8">
                <Book className="w-10 h-10 text-peacock-700 mx-auto mb-2" />
                <h2 className="text-2xl font-serif font-bold text-krishna-900">Study Resources</h2>
                <p className="text-krishna-600 text-sm">Curated tools to deepen your understanding</p>
              </header>
              
              <div className="space-y-4">
                {STUDY_RESOURCES.map((resource, index) => (
                  <a 
                    key={index}
                    href={resource.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="group block p-5 bg-white border border-krishna-100 rounded-2xl shadow-sm hover:shadow-md hover:border-peacock-200 transition-all relative overflow-hidden"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-krishna-50 rounded-xl group-hover:bg-peacock-50 transition-colors">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-krishna-900 group-hover:text-peacock-700 transition-colors">
                            {resource.title}
                          </h3>
                          {resource.isFavorite && (
                            <span className="flex items-center space-x-1 px-2 py-0.5 bg-peacock-100 text-peacock-800 text-[9px] font-bold uppercase rounded-full">
                              <Heart className="w-2.5 h-2.5 fill-current" />
                              <span>My Favorite</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-krishna-600 leading-relaxed">
                          {resource.description}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-krishna-300 group-hover:text-peacock-500 transition-colors self-start mt-1" />
                    </div>
                  </a>
                ))}
              </div>
              
              <p className="mt-8 text-center text-xs text-krishna-400 italic">
                Knowledge is the greatest treasure. Keep learning.
              </p>
            </div>
          )}
          {currentView === 'privacy' && (
            <div className="p-8 max-w-3xl mx-auto bg-white min-h-screen">
              <button onClick={() => setCurrentView('home')} className="mb-4 text-krishna-500 flex items-center hover:text-krishna-700">
                <ArrowLeft className="w-4 h-4 mr-2"/>Back
              </button>
              <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-krishna-700 leading-relaxed">
                Gita AI Assistant is designed for students. We do not collect, store, or share any personal information on our servers. 
                Your chat sessions are stored locally in your browser's "LocalStorage" for your own reference and are not accessible to us or any third parties. 
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
