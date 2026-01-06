import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import arkeliumLogo from '@/assets/arkelium-logo.png';

type Lang = 'en' | 'fr';

export default function ForgotPassword() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const t = useMemo(() => {
    const dict = {
      en: {
        title: 'Reset Password',
        subtitle: 'Enter your email address and we will send you a reset link',
        email: 'Email',
        placeholder: 'name@company.com',
        button: 'Send Reset Link',
        back: 'Back to login',
        sent: 'If an account exists for this email, a reset link has been sent.',
        invalid: 'Please enter a valid email.',
        failed: 'Unable to send reset link. Please try again.',
      },
      fr: {
        title: 'Réinitialiser le mot de passe',
        subtitle: "Entrez votre e-mail et nous vous enverrons un lien de réinitialisation",
        email: 'E-mail',
        placeholder: 'nom@entreprise.com',
        button: 'Envoyer le lien',
        back: 'Retour à la connexion',
        sent: "Si un compte existe pour cet e-mail, un lien a été envoyé.",
        invalid: 'Veuillez saisir un e-mail valide.',
        failed: "Impossible d'envoyer le lien. Réessayez.",
      },
    } satisfies Record<Lang, any>;

    return dict[(language as Lang) || 'en'];
  }, [language]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrim = email.trim();
    if (!emailTrim || !emailTrim.includes('@')) {
      setErrorMsg(t.invalid);
      return;
    }

    setIsSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, { redirectTo });
      if (error) throw error;

      setSuccessMsg(t.sent);
    } catch (err) {
      console.error('[ForgotPassword] resetPasswordForEmail error:', err);
      setErrorMsg(t.failed);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${
        isDark
          ? 'bg-[hsl(220,20%,8%)]'
          : 'bg-[hsl(220,20%,97%)]'
      }`}
      style={{ zoom: 0.85 }}
    >
      {/* Top right controls */}
      <div className="fixed top-6 right-6 z-20">
        <div className="flex items-center gap-3">
          <Select value={(language as Lang) || 'en'} onValueChange={(val: Lang) => setLanguage(val)}>
            <SelectTrigger
              className={`w-16 h-9 backdrop-blur-sm transition-colors text-xs ${
                isDark
                  ? 'bg-[hsl(220,20%,12%)] border-[hsl(220,15%,20%)] hover:bg-[hsl(220,20%,16%)] text-[hsl(220,15%,70%)]'
                  : 'bg-white border-[hsl(220,15%,85%)] hover:bg-[hsl(220,20%,95%)] text-[hsl(220,20%,30%)]'
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={isDark ? 'bg-[hsl(220,20%,12%)] border-[hsl(220,15%,20%)]' : 'bg-white border-[hsl(220,15%,85%)]'}>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="fr">FR</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className={`h-9 w-9 backdrop-blur-sm transition-colors ${
              isDark
                ? 'bg-[hsl(220,20%,12%)] border-[hsl(220,15%,20%)] hover:bg-[hsl(220,20%,16%)] text-[hsl(220,15%,70%)]'
                : 'bg-white border-[hsl(220,15%,85%)] hover:bg-[hsl(220,20%,95%)] text-[hsl(220,20%,30%)]'
            }`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Bottom left */}
      <div
        className={`fixed bottom-8 left-8 text-xs font-medium tracking-wide ${
          isDark ? 'text-[hsl(220,15%,40%)]' : 'text-[hsl(220,15%,50%)]'
        }`}
      >
        Powered by Arkelium
      </div>

      {/* Centered Card */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-[440px]">
          <div
            className={`rounded-xl p-8 ${
              isDark
                ? 'bg-[hsl(220,20%,10%)] border border-[hsl(220,15%,18%)] shadow-2xl'
                : 'bg-white border border-[hsl(220,15%,88%)] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]'
            }`}
          >
            <div className="flex flex-col items-center gap-3 mb-6">
              <img src={arkeliumLogo} alt="Arkelium" className="h-20 w-auto select-none" />
              <div className="text-center">
                <h1 className={`text-lg font-semibold ${isDark ? 'text-[hsl(220,15%,90%)]' : 'text-[hsl(220,20%,15%)]'}`}>
                  {t.title}
                </h1>
                <p className={`mt-1.5 text-sm ${isDark ? 'text-[hsl(220,15%,55%)]' : 'text-[hsl(220,15%,45%)]'}`}>
                  {t.subtitle}
                </p>
              </div>
            </div>

            {errorMsg ? (
              <div
                className={`mb-5 rounded-lg px-4 py-3 text-sm ${
                  isDark
                    ? 'bg-red-950/30 border border-red-900/30 text-red-200/90'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {errorMsg}
              </div>
            ) : null}

            {successMsg ? (
              <div
                className={`mb-5 rounded-lg px-4 py-3 text-sm ${
                  isDark
                    ? 'bg-blue-950/30 border border-blue-900/30 text-blue-200/90'
                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                }`}
              >
                {successMsg}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className={isDark ? 'text-[hsl(220,15%,80%)]' : 'text-[hsl(220,20%,20%)]'}>{t.email}</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder={t.placeholder}
                  className={`h-11 ${
                    isDark
                      ? 'bg-[hsl(220,20%,8%)] border-[hsl(220,15%,20%)] text-[hsl(220,15%,90%)] placeholder:text-[hsl(220,15%,35%)]'
                      : 'bg-white border-[hsl(220,15%,85%)] text-[hsl(220,20%,15%)] placeholder:text-[hsl(220,15%,55%)]'
                  }`}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className={`h-11 w-full rounded-lg text-sm font-semibold ${
                  isDark 
                    ? 'bg-[hsl(220,20%,90%)] text-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,85%)]' 
                    : 'bg-[hsl(220,20%,15%)] text-white hover:bg-[hsl(220,20%,25%)]'
                }`}
              >
                {isSubmitting ? '...' : t.button}
              </Button>

              <div className="flex items-center justify-center">
                <Link
                  to="/login"
                  className={`text-sm underline-offset-4 hover:underline ${
                    isDark ? 'text-[hsl(220,15%,65%)]' : 'text-[hsl(220,15%,40%)]'
                  }`}
                >
                  ← {t.back}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
