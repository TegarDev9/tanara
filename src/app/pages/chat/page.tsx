'use client';

import { useState, FormEvent, useRef, useEffect, SVGProps } from 'react';

// Define the color palette (REMOVED - Using Tailwind theme)
// const colors = { ... };

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isLoading?: boolean;
}

// Send Icon Component (no changes needed if using currentColor by default)
const SendIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </svg>
);

// Loading Spinner Icon Component (animate-spin is Tailwind)
const LoadingSpinnerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Settings Icon Component (no changes needed if using currentColor by default)
const SettingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 0 1 0 1.257c-.008.379.137.75.43.99l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.333.184-.582.496-.646.87l-.212 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.646-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 0 1 0-1.257c.008-.379-.137-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.354.133.75.072 1.075-.124.072-.044.146-.087.22-.128.332-.184.582-.496.646-.87l.212-1.281Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

// Close Icon Component (no changes needed if using currentColor by default)
const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const availableModels = ['gemini-2.0-flash', 'gemini-pro', 'gemini-ultra'];
  
  const recommendedPrompts = [
    "Buatkan saya cerita pendek tentang petualangan di luar angkasa.",
    "Jelaskan konsep relativitas umum dengan bahasa yang sederhana.",
    "Berikan ide resep masakan untuk makan malam keluarga.",
    "Tuliskan puisi tentang keindahan alam Indonesia.",
    "Apa saja tips untuk belajar bahasa baru secara efektif?"
  ];
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    const loadingBotMessageId = (Date.now() + 1).toString();
    const loadingBotMessage: Message = {
      id: loadingBotMessageId,
      sender: 'bot',
      text: '...', // Placeholder for loading
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingBotMessage]);

    // Ensure this URL matches your API route structure in Next.js
    // For App Router, this would map to app/api/llm/gemini/generate_conten_chat/route.ts
    const apiUrl = '/api/llm/gemini/generate_conten_chat'; // CORRECTED
    console.log(`Sending prompt to ${apiUrl} with model: ${selectedModel}`);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: currentInput,
          // model: selectedModel // Uncomment if your backend uses this
        }),
      });

      if (!response.ok) {
        // Attempt to parse error response from backend if available
        let errorDataMessage = `Error from bot server (${response.status} ${response.statusText})`;
        try {
          const errorData = await response.json();
          errorDataMessage = errorData.error || JSON.stringify(errorData) || errorDataMessage;
        } catch {
          try {
            const errorText = await response.text();
            errorDataMessage = errorText ? `${errorDataMessage}: ${errorText}` : errorDataMessage;
          } catch {
             errorDataMessage = `Error from bot server (${response.status} ${response.statusText}) - Gagal membaca detail error.`;
          }
        }
        throw new Error(errorDataMessage);
      }

      const data = await response.json();
      const botMessageText = data.text || 'Maaf, saya tidak dapat memproses itu saat ini.';
      
      const botMessage: Message = {
        id: Date.now().toString(), // Use a new ID for the actual bot message
        sender: 'bot',
        text: botMessageText,
        isLoading: false,
      };
      // Replace the loading message with the actual bot message
      setMessages((prev) => prev.map(msg => msg.id === loadingBotMessageId ? botMessage : msg));

    } catch (error) {
      console.error('Chat submission error:', error);
      const errorMessageText = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
      const errorBotMessage: Message = {
        id: loadingBotMessageId, // Reuse ID to replace the loading message
        sender: 'bot',
        text: `Error: ${errorMessageText}`,
        isLoading: false,
      };
      setMessages((prev) => prev.map(msg => msg.id === loadingBotMessageId ? errorBotMessage : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSettingsPopup = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  const handleRecommendedPromptClick = (prompt: string) => {
    setInput(prompt);
    // Optionally, submit the form directly or just fill the input
    // handleSubmit(new Event('submit') as any); // Uncomment to auto-submit
    setIsSettingsOpen(false); 
  };


  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto font-sans relative bg-background text-foreground">
      {/* Header */}
      <header
        className="p-4 text-lg font-semibold text-center sticky top-0 z-20 shadow-lg flex items-center justify-between bg-neutral-900 text-primary border-b border-border"
      >
        <span className="flex-grow text-center">Hands chat</span> {/* Centered Title */}
        <button
          onClick={toggleSettingsPopup}
          className="p-2 rounded-full hover:bg-neutral-700/60 focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-2 focus:ring-offset-neutral-900 transition-colors duration-150 text-primary"
          aria-label="Settings"
        >
          <SettingsIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Settings Popup */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div
            className="bg-card text-foreground rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ease-out scale-100 border border-border"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-primary">Pengaturan</h2>
              <button
                onClick={toggleSettingsPopup}
                className="p-2 rounded-full text-muted-foreground hover:bg-neutral-700/60 hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Close settings"
              >
                <CloseIcon className="w-6 h-6"/>
              </button>
            </div>

            {/* Model Selection */}
            <div className="mb-6">
              <label htmlFor="gemini-model" className="block text-sm font-medium mb-2 text-foreground">
                Pilih Model Gemini:
              </label>
              <select
                id="gemini-model"
                value={selectedModel}
                onChange={handleModelChange}
                className={`w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 ease-in-out bg-background text-foreground`}
              >
                {availableModels.map(model => (
                  <option key={model} value={model} className="bg-background text-foreground">
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* Recommended Prompts */}
            <div className="mb-2">
              <h3 className="text-lg font-medium mb-3 text-foreground">Rekomendasi Prompt:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {recommendedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecommendedPromptClick(prompt)}
                    className="w-full text-left p-3 border border-border rounded-lg hover:shadow-md transition-shadow duration-150 text-sm bg-neutral-800/70 hover:bg-neutral-700/90 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg 
              ${ msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-foreground rounded-bl-none'} 
              ${msg.isLoading ? 'animate-pulse opacity-80' : ''}`}
            >
              {/* Render newlines correctly */}
              {msg.text.split('\n').map((line, index, arr) => (
                <span key={index} className="block break-words whitespace-pre-wrap">
                  {line}
                  {/* Add <br/> only if it's not the last line, to prevent extra space.
                      However, CSS white-space: pre-wrap on the parent might be a cleaner way
                      if you want to preserve all whitespace and newlines from the string directly.
                  */}
                  {index < arr.length - 1 && <br/>}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 border-t border-border sticky bottom-0 z-20 bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan Anda..."
            className={`flex-grow p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 ease-in-out text-foreground placeholder:text-muted-foreground bg-card disabled:opacity-70`}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`p-3 rounded-lg transition-all duration-200 ease-in-out shadow-md hover:shadow-lg active:shadow-sm bg-primary text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed`}
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinnerIcon className="w-6 h-6" />
            ) : (
              <SendIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </form>
      {/* Custom scrollbar styles - ensuring they use theme variables if possible */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-border, #333333); /* Fallback to direct value */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-muted-foreground, #A0A0A0); /* Fallback to direct value */
        }
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--color-border, #333333) transparent;
        }
      `}</style>
    </div>
  );
}
