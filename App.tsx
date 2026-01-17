
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, ArrowLeft, ExternalLink, Sparkles, Book, Trash2, 
  Quote, Search, X, Youtube, Globe, FileText, Music, Heart
} from 'lucide-react';
import { CHAPTERS, GITA_PDF_URL, GITA_QUOTES, STUDY_RESOURCES } from './constants';
import { ChatMessage, View } from './types';
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
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: "Namaste! I am Krishna. Ask me anything about your studies, focus, or life duties."
      }]);
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  };

  const handleChapterClick = (id: number) => {
    setSelectedChapterId(id);
    setCurrentView('chapter');
  };

  const selectedChapter = CHAPTERS.find(c => c.id === selectedChapterId);

  return (
    <div className="min-h-screen bg-krishna-50 pb-20 font-sans text-krishna-900 selection:bg-krishna-200">
      <PeacockBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-krishna-100 shadow-sm px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PeacockFeather className="w-8 h-8 text-peacock-600" />
            <h1 className="text-xl font-serif font-bold text-krishna-900">Gita Guide</h1>
          </div>
          {currentView === 'chat' && (
            <button 
              onClick={handleClearChat}
              className="p-2 text-krishna-300 hover:text-red-500 transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4">
        {currentView === 'home' && (
          <div className="space-y-6">
            {/* Daily Quote Card */}
            <div className="bg-gradient-to-br from-krishna-800 to-peacock-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <Quote className="absolute -right-4 -top-4 w-24 h-24 text-white/10" />
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-4 backdrop-blur-sm uppercase tracking-wider">
                  Daily Verse
                </span>
                <p className="text-xl font-serif font-bold mb-2 leading-tight">
                  "{dailyQuote.devnagari}"
                </p>
                <p className="text-sm opacity-90 italic mb-3">
                  {dailyQuote.translation}
                </p>
                <div className="h-px w-full bg-white/20 my-4" />
                <div className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-300 mt-1 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    <span className="text-amber-100">Student Lesson:</span> {dailyQuote.lesson}
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-krishna-300 group-focus-within:text-peacock-600 transition-colors" />
              <input
                type="text"
                placeholder="Search chapters or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-krishna-200 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-peacock-500 focus:border-transparent shadow-sm transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-krishna-300" />
                </button>
              )}
            </div>

            {/* Chapter List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-krishna-800 flex items-center">
                  <Book className="w-5 h-5 mr-2 text-peacock-600" />
                  Bhagavad Gita Chapters
                </h2>
                <span className="text-xs font-medium text-krishna-400">
                  {filteredChapters.length} Chapters Found
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filteredChapters.map(chap => (
                  <ChapterCard 
                    key={chap.id} 
                    chapter={chap} 
                    onClick={handleChapterClick} 
                  />
                ))}
              </div>
              {filteredChapters.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-krishna-200">
                  <Search className="w-12 h-12 text-krishna-100 mx-auto mb-3" />
                  <p className="text-krishna-400">No chapters matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'chapter' && selectedChapter && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex items-center text-peacock-700 font-medium hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Chapters
            </button>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-krishna-100">
              <span className="text-peacock-600 font-bold tracking-widest text-xs uppercase mb-2 block">
                Chapter {selectedChapter.id}
              </span>
              <h2 className="text-3xl font-serif font-bold text-krishna-900 mb-1 leading-tight">
                {selectedChapter.sanskritName}
              </h2>
              <h3 className="text-xl text-krishna-700 font-hindi mb-4">
                {selectedChapter.translation}
              </h3>
              <p className="text-krishna-500 italic mb-6">
                {selectedChapter.englishName}
              </p>
              
              <div className="prose prose-stone">
                <p className="text-krishna-800 leading-relaxed text-lg mb-8">
                  {selectedChapter.summary}
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <a 
                  href={selectedChapter.detailedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 bg-peacock-700 text-white rounded-2xl py-4 font-bold shadow-lg shadow-peacock-100 active:scale-95 transition-transform"
                >
                  <Globe className="w-5 h-5" />
                  <span>Read Detailed Commentary</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a 
                  href={GITA_PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 bg-krishna-100 text-krishna-700 rounded-2xl py-4 font-bold hover:bg-krishna-200 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span>View Hindi PDF</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {currentView === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-3xl shadow-sm border border-krishna-100 overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      m.role === 'user' 
                        ? 'bg-peacock-700 text-white rounded-tr-none shadow-md shadow-peacock-100' 
                        : 'bg-krishna-50 text-krishna-800 rounded-tl-none border border-krishna-100'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-krishna-200/50">
                        <p className="text-[10px] font-bold text-krishna-400 uppercase tracking-wider mb-1">Sources</p>
                        <div className="flex flex-wrap gap-2">
                          {m.citations.map((url, i) => (
                            <a 
                              key={i} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-0.5 bg-white border border-krishna-200 rounded-full text-[10px] text-peacock-700 hover:bg-peacock-50 transition-colors truncate max-w-[150px]"
                            >
                              <ExternalLink className="w-2.5 h-2.5 mr-1" />
                              Source {i + 1}
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
                  <div className="bg-krishna-50 border border-krishna-100 rounded-2xl rounded-tl-none px-4 py-3 flex space-x-1 items-center">
                    <div className="w-1.5 h-1.5 bg-peacock-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-peacock-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-peacock-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-krishna-50 border-t border-krishna-100">
              <div className="flex items-center space-x-2 bg-white rounded-2xl border border-krishna-200 p-1 pr-2 shadow-inner focus-within:ring-2 focus-within:ring-peacock-500 focus-within:border-transparent transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask Krishna a question..."
                  className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-4 text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`p-2.5 rounded-xl transition-all ${
                    !input.trim() || isLoading 
                      ? 'bg-krishna-100 text-krishna-300' 
                      : 'bg-peacock-700 text-white shadow-lg shadow-peacock-100 active:scale-90'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-center text-krishna-400 mt-3">
                Gita AI Assistant may provide helpful guidance based on the Gita. Always use your own wisdom.
              </p>
            </div>
          </div>
        )}

        {currentView === 'resources' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="flex items-center space-x-3 mb-2 px-1">
              <FileText className="w-6 h-6 text-peacock-700" />
              <h2 className="text-2xl font-serif font-bold text-krishna-900">Study Resources</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {STUDY_RESOURCES.map((resource, index) => (
                <a 
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl p-5 border border-krishna-200 hover:border-peacock-200 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-xl ${
                      resource.type === 'video' ? 'bg-red-50 text-red-600' :
                      resource.type === 'book' ? 'bg-krishna-50 text-krishna-700' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {resource.type === 'video' && <Youtube className="w-5 h-5" />}
                      {resource.type === 'book' && <Book className="w-5 h-5" />}
                      {resource.type === 'web' && <Globe className="w-5 h-5" />}
                    </div>
                    {resource.isFavorite && (
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    )}
                  </div>
                  <h3 className="font-bold text-krishna-900 mb-1 group-hover:text-peacock-700 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-krishna-500 text-sm leading-relaxed">
                    {resource.description}
                  </p>
                  <div className="mt-4 flex items-center text-xs font-bold text-peacock-700 uppercase tracking-wider">
                    Open Resource <ExternalLink className="w-3 h-3 ml-1" />
                  </div>
                </a>
              ))}
              
              <div className="bg-gradient-to-br from-krishna-800 to-krishna-900 rounded-2xl p-6 text-white shadow-xl mt-4">
                <Music className="w-8 h-8 text-gold-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Listen & Learn</h3>
                <p className="text-krishna-300 text-sm mb-6 leading-relaxed">
                  Deepen your understanding through traditional chants and expert commentaries available in our curated collection.
                </p>
                <button 
                  onClick={() => window.open('https://www.youtube.com/results?search_query=bhagavad+gita+chanting', '_blank')}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-3 text-sm font-bold transition-colors"
                >
                  Browse More on YouTube
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

export default App;
