import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Lock, Zap, Sparkles, Loader2, Plus, History, Trash2, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

const SUGGESTIONS = [
  "Quels sont les meilleurs matchs du jour ?",
  "Pourquoi cette confiance sur le dernier match ?",
  "Quel est ton taux de réussite actuel ?",
  "Quels matchs sont les plus sûrs aujourd'hui ?",
];

export default function PronosiaAI() {
  const { user, isPremium, isPremiumPlus, isAdmin } = useAuth();
  const hasAccess = isPremium || isPremiumPlus || isAdmin;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("id, title, messages, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(30);
      if (!error && data) {
        setConversations(data.map(d => ({
          ...d,
          messages: (d.messages as any) || [],
        })));
      }
    } catch (e) {
      console.error("Load conversations error:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && hasAccess) loadConversations();
  }, [user, hasAccess, loadConversations]);

  // Save current conversation (debounced)
  const saveConversation = useCallback(async (msgs: Message[], convoId: string | null) => {
    if (!user || msgs.length === 0) return;
    
    const title = msgs[0]?.content?.slice(0, 50) || "Nouvelle conversation";
    
    try {
      if (convoId) {
        await supabase
          .from("chat_conversations")
          .update({ messages: msgs as any, title, updated_at: new Date().toISOString() })
          .eq("id", convoId);
      } else {
        const { data, error } = await supabase
          .from("chat_conversations")
          .insert({ user_id: user.id, messages: msgs as any, title })
          .select("id")
          .single();
        if (!error && data) {
          setActiveConvoId(data.id);
        }
      }
    } catch (e) {
      console.error("Save conversation error:", e);
    }
  }, [user]);

  const debouncedSave = useCallback((msgs: Message[], convoId: string | null) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveConversation(msgs, convoId), 1500);
  }, [saveConversation]);

  // Load a specific conversation
  const loadConversation = (convo: Conversation) => {
    setMessages(convo.messages);
    setActiveConvoId(convo.id);
    setShowHistory(false);
  };

  // New conversation
  const newConversation = () => {
    setMessages([]);
    setActiveConvoId(null);
    setShowHistory(false);
  };

  // Delete conversation
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("chat_conversations").delete().eq("id", id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvoId === id) newConversation();
    toast.success("Conversation supprimée");
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) { toast.error("Session expirée"); setIsLoading(false); return; }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pronosia-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: newMsgs }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || "Erreur de communication avec l'IA");
        setIsLoading(false);
        return;
      }

      if (!resp.body) { toast.error("Pas de réponse"); setIsLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalMessages = newMsgs;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  finalMessages = prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                } else {
                  finalMessages = [...prev, { role: "assistant", content: assistantContent }];
                }
                return finalMessages;
              });
            }
          } catch { /* partial */ }
        }
      }

      // Save after response complete
      debouncedSave(finalMessages, activeConvoId);
      loadConversations();
    } catch (e) {
      console.error(e);
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, activeConvoId, debouncedSave, loadConversations]);

  if (!user || !hasAccess) {
    return (
      <div className="min-h-screen pb-24 pt-20">
        <Navbar />
        <div className="container max-w-lg mx-auto px-4 pt-12 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Pronosia AI</h1>
            <p className="text-muted-foreground text-sm">
              Discute avec notre IA pour comprendre les prédictions, analyser les matchs et obtenir des insights exclusifs.
            </p>
            <Card className="p-4 border-primary/20 bg-primary/5">
              <p className="text-sm font-medium text-primary">🔒 Réservé aux abonnés Premium & Premium+</p>
            </Card>
            <Link to={user ? "/pricing" : "/login"}>
              <Button className="btn-shimmer btn-glow gap-2">
                <Zap className="h-4 w-4" /> {user ? "Passer Premium" : "Se connecter"}
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 pt-16 md:pb-4">
      <Navbar />
      <div className="container max-w-2xl mx-auto px-3 flex flex-col flex-1 gap-2">
        {/* Header */}
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Pronosia AI</h1>
              <p className="text-[11px] text-muted-foreground">Pose tes questions sur les matchs et prédictions</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={newConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* History panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border/50 rounded-xl p-3 mb-2 max-h-60 overflow-y-auto space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">Historique ({conversations.length})</p>
                {loadingHistory && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />}
                {!loadingHistory && conversations.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">Aucune conversation</p>
                )}
                {conversations.map(c => (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(c)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      activeConvoId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-xs">{c.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(c.updated_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                    </span>
                    <button
                      onClick={(e) => deleteConversation(c.id, e)}
                      className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1" style={{ maxHeight: "calc(100vh - 220px)" }}>
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-8">
              <p className="text-center text-sm text-muted-foreground mb-4">Suggestions :</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => sendMessage(s)}
                    className="text-left p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all text-sm text-muted-foreground hover:text-foreground"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border/50 rounded-bl-md"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex gap-2 py-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Pose ta question..."
            className="flex-1 bg-card/80 border-border/50 rounded-xl"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="rounded-xl btn-shimmer shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
