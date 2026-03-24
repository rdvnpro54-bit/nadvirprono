import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container flex min-h-screen items-center justify-center pt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                <Brain className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold">
                {isRegister ? "Créer un compte" : "Connexion"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRegister ? "Rejoignez Nadvir AI" : "Accédez à vos pronostics IA"}
              </p>
            </div>

            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" placeholder="John Doe" className="bg-muted/50" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="vous@email.com" className="bg-muted/50 pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="bg-muted/50 pl-10" />
                </div>
              </div>
              <Button className="w-full gap-2" size="lg">
                <Brain className="h-4 w-4" />
                {isRegister ? "Créer mon compte" : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isRegister ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
