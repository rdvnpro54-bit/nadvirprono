import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
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
  "🏆 Meilleurs matchs du jour",
  "📊 Taux de réussite actuel",
  "🟢 Matchs les plus sûrs",
  "🔍 Meilleur sport",
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
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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

  const loadConversation = (convo: Conversation) => {
    setMessages(convo.messages);
    setActiveConvoId(convo.id);
    setShowHistory(false);
  };

  const newConversation = () => {
    setMessages([]);
    setActiveConvoId(null);
    setShowHistory(false);
  };

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

    // Blur input to dismiss keyboard and prevent zoom
    inputRef.current?.blur();

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
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch { /* partial */ }
        }
      }

      const finalMessages = assistantContent
        ? [...newMsgs, { role: "assistant" as const, content: assistantContent }]
        : newMsgs;

      await saveConversation(finalMessages, activeConvoId);
      loadConversations();
    } catch (e) {
      console.error(e);
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, activeConvoId, saveConversation, loadConversations]);

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
    <div className="fixed inset-0 flex flex-col pt-14 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 bg-background">
      <Navbar />
      <div className="flex flex-col flex-1 min-h-0 max-w-2xl w-full mx-auto">
        {/* Header - sleek & powerful */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-border/20"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight tracking-tight">Pronosia AI</h1>
              <p className="text-[10px] text-primary font-medium">● En ligne • Prêt à analyser</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-xl transition-colors ${showHistory ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={newConversation}>
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
              className="overflow-hidden shrink-0"
            >
              <div className="bg-card/80 backdrop-blur border-b border-border/20 p-3 max-h-48 overflow-y-auto space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Historique ({conversations.length})
                </p>
                {loadingHistory && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />}
                {!loadingHistory && conversations.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">Aucune conversation</p>
                )}
                {conversations.map(c => (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(c)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm ${
                      activeConvoId === c.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-muted/50 text-foreground"
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

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 space-y-3 px-3 py-3">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full space-y-5">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-2xl shadow-primary/30">
                  <Bot className="h-10 w-10 text-primary-foreground" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-[8px] font-bold text-white">AI</span>
                </motion.div>
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold">Pronosia AI</h2>
                <p className="text-xs text-muted-foreground max-w-[260px]">
                  Analyse les matchs, compare les sports, explore les stats. Pose ta question.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm px-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => sendMessage(s)}
                    className="text-left p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all text-xs text-muted-foreground hover:text-foreground leading-tight"
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm text-[13px]"
                    : "bg-card/80 border border-border/30 rounded-bl-sm"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-primary [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs text-[13px] leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="bg-card/80 border border-border/30 rounded-2xl rounded-bl-sm px-5 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Input bar - font-size 16px prevents iOS zoom */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="shrink-0 flex gap-2 px-3 py-2.5 border-t border-border/20 bg-background/95 backdrop-blur-sm"
        >
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Pose ta question..."
              disabled={isLoading}
              className="w-full h-11 px-4 rounded-xl bg-card/80 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50"
              style={{ fontSize: "16px" }}
            />
          </div>
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="rounded-xl shrink-0 h-11 w-11 bg-gradient-to-br from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20 transition-all"
          >
            <Send className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
