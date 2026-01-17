
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { HashRouter } from 'react-router-dom';
import { 
  Send, ArrowLeft, ExternalLink, Sparkles, Book, Download, 
  Info, Shield, Trash2, Share2, Quote, Search, 
  X, Volume2, Star, Wind, Bookmark
} from 'lucide-react';
import { CHAPTERS, GITA_PDF_URL, GITA_QUOTES } from './constants';
import { ChatMessage, View, SavedVerse } from './types';
import { sendGitaQuestion, generateSpeech, decodeBase64, decodeAudioData } from './services/geminiService';
import ChapterCard from './components/ChapterCard';
import BottomNav from './components/BottomNav';
import { PeacockFeather, PeacockBackground } from './components/PeacockFeather';

// --- Practice Component (Fixing Hook Violation) ---
const Practice: React.FC = () => {
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    let interval: any;
    if (isActive && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  const startTimer = (mins: number) => {
    setTimer(mins * 60);
    setIsActive(true);
  };

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto flex flex-col items-center">
      <header className="mb-12 text-center pt-8">
        <Wind className="h-12 w-12 text-peacock-600 mx-auto mb-4 animate-pulse" />
        <h1 className="text-3xl font-serif font-bold text-krishna-900">Dhyana Yoga</h1>
        <p className="text-krishna-600">Cultivate a steady mind for study</p>
      </header>

      <div className="relative w-64 h-64 flex items-center justify-center mb-12">
         <div className={`absolute inset-0 bg-peacock-100 rounded-full ${isActive ? 'animate-ping opacity-20' : 'opacity-10'}`}></div>
         <div className={`w-48 h-48 rounded-full border-4 border-peacock-200 flex flex-col items-center justify-center bg-white shadow-xl z-10 transition-transform duration-1000 ${isActive ? 'scale-110' : 'scale-100'}`}>
            <span className="text-4xl font-mono font-bold text-peacock-800">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
            <p className="text-[10px] uppercase font-bold text-peacock-400 mt-2">{isActive ? 'Focus' : 'Ready'}</p>
         </div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8">
        {[1, 3, 5].map(m => (
          <button key={m} onClick={() => startTimer(m)} className="py-2 bg-white border border-peacock-100 rounded-xl font-bold text-peacock-700 shadow-sm hover:bg-peacock-50 transition-colors">
            {m}m
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-krishna-100 w-full text-center italic text-krishna-700">
        <Quote className="w-6 h-6 text-peacock-200 mb-2 mx-auto" />
        "For him who has conquered the mind, the mind is the best of friends." (Ch 6, V 6)
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>([]);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Local Storage for bookmarks
  useEffect(() => {
    const saved = localStorage.getItem('gita_bookmarks');
    if (saved) setSavedVerses(JSON.parse(saved));
  }, []);

  const saveToBookmarks = (quote: typeof GITA_QUOTES[0]) => {
    const exists = savedVerses.some(v => v.verse === quote.verse);
    let newList;
    if (exists) {
      newList = savedVerses.filter(v => v.verse !== quote.verse);
    } else {
      newList = [...savedVerses, { ...quote, dateSaved: new Date().toISOString() }];
    }
    setSavedVerses(newList);
    localStorage.setItem('gita_bookmarks', JSON.stringify(newList));
  };

  const dailyQuote = useMemo(() => {
    const today = new Date();
    const index = (today.getFullYear() + today.getMonth() + today.getDate()) % GITA_QUOTES.length;
    return GITA_QUOTES[index];
  }, []);

  const handlePlayTts = async (text: string) => {
    if (isTtsLoading) return;
    setIsTtsLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const base64 = await generateSpeech(text);
      const bytes = decodeBase64(base64);
      const buffer = await decodeAudioData(bytes, audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
    } catch (err) {
      console.error("TTS Playback failed:", err);
      alert("Audio playback failed. Please check your internet connection.");
    } finally {
      setIsTtsLoading(false);
    }
  };

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

      <div className="mb-6 bg-gradient-to-br from-peacock-50 to-white rounded-2xl p-6 shadow-sm border border-peacock-100 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-peacock-600 uppercase tracking-widest flex items-center">Daily Wisdom</span>
            <div className="flex space-x-2">
              <button 
                onClick={() => handlePlayTts(`${dailyQuote.verse}. ${dailyQuote.translation}`)} 
                className={`p-2 rounded-full hover:bg-peacock-100 transition-colors ${isTtsLoading ? 'animate-pulse text-peacock-300' : 'text-peacock-600'}`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => saveToBookmarks(dailyQuote)}
                className={`p-2 rounded-full hover:bg-gold-50 transition-colors ${savedVerses.some(v => v.verse === dailyQuote.verse) ? 'text-gold-500' : 'text-krishna-300'}`}
              >
                <Star className={`w-4 h-4 ${savedVerses.some(v => v.verse === dailyQuote.verse) ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
          <p className="text-krishna-900 font-serif italic text-lg leading-relaxed mb-3">"{dailyQuote.verse}"</p>
          <p className="text-krishna-700 text-sm mb-4">"{dailyQuote.translation}"</p>
          <div className="bg-peacock-600/5 p-3 rounded-xl border border-peacock-100/50">
            <p className="text-peacock-800 text-xs font-medium"><span className="font-bold">Student Tip:</span> {dailyQuote.lesson}</p>
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

      {savedVerses.length > 0 && (
        <div className="mt-12">
          <h3 className="text-sm font-bold text-krishna-400 uppercase tracking-widest mb-4 flex items-center">
            <Bookmark className="w-4 h-4 mr-2" /> Saved Insights
          </h3>
          <div className="space-y-3">
            {savedVerses.map((v, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-gold-100 shadow-sm flex justify-between items-start">
                <div>
                  <p className="text-xs font-serif italic text-krishna-900">"{v.verse}"</p>
                  <p className="text-[10px] text-krishna-500 mt-1">{v.translation.substring(0, 60)}...</p>
                </div>
                <button onClick={() => saveToBookmarks(v as any)} className="text-gold-500 p-1"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

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
          {currentView === 'practice' && <Practice />}
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
