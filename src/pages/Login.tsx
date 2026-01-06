import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import arkeliumLogo from '@/assets/arkelium-logo.png';

type Lang = 'en' | 'fr';

export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = useMemo(() => {
    const dict = {
      en: {
        email: 'Email',
        password: 'Password',
        remember: 'Remember me',
        forgot: 'Forgot password?',
        secure: 'Secure access for authorized users only',
        loading: 'Signing in...',
        button: 'Sign In',
        invalid: 'Please enter a valid email and password.',
        failed: 'Unable to sign in. Please check your credentials.',
      },
      fr: {
        email: 'E-mail',
        password: 'Mot de passe',
        remember: 'Se souvenir de moi',
        forgot: 'Mot de passe oublié ?',
        secure: 'Accès sécurisé réservé aux utilisateurs autorisés',
        loading: 'Connexion...',
        button: 'Se connecter',
        invalid: 'Veuillez saisir un e-mail et un mot de passe valides.',
        failed: 'Impossible de se connecter. Vérifiez vos identifiants.',
      },
    } satisfies Record<Lang, any>;

    return dict[(language as Lang) || 'en'];
  }, [language]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const emailTrim = email.trim();
    if (!emailTrim || !password.trim()) {
      setErrorMsg(t.invalid);
      return;
    }

    setIsSubmitting(true);
    try {
      localStorage.setItem('arkelium_remember_me', String(rememberMe));

      if (typeof (auth as any).login !== 'function') {
        throw new Error('AuthContext: login() not found.');
      }

      await (auth as any).login(emailTrim, password);

      navigate('/', { replace: true });
    } catch (err) {
      console.error('[Login] login error:', err);
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
            <div className="flex flex-col items-center gap-2 mb-8">
              <img src={arkeliumLogo} alt="Arkelium" className="h-24 w-auto select-none" />
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className={isDark ? 'text-[hsl(220,15%,80%)]' : 'text-[hsl(220,20%,20%)]'}>{t.email}</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  className={`h-11 ${
                    isDark
                      ? 'bg-[hsl(220,20%,8%)] border-[hsl(220,15%,20%)] text-[hsl(220,15%,90%)] placeholder:text-[hsl(220,15%,35%)]'
                      : 'bg-white border-[hsl(220,15%,85%)] text-[hsl(220,20%,15%)] placeholder:text-[hsl(220,15%,55%)]'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-[hsl(220,15%,80%)]' : 'text-[hsl(220,20%,20%)]'}>{t.password}</Label>
                <div className="relative">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={`h-11 pr-12 ${
                      isDark
                        ? 'bg-[hsl(220,20%,8%)] border-[hsl(220,15%,20%)] text-[hsl(220,15%,90%)] placeholder:text-[hsl(220,15%,35%)]'
                        : 'bg-white border-[hsl(220,15%,85%)] text-[hsl(220,20%,15%)] placeholder:text-[hsl(220,15%,55%)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 transition ${
                      isDark ? 'text-[hsl(220,15%,50%)] hover:bg-[hsl(220,20%,15%)]' : 'text-[hsl(220,15%,45%)] hover:bg-[hsl(220,20%,95%)]'
                    }`}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(Boolean(v))} />
                  <span className={`text-sm ${isDark ? 'text-[hsl(220,15%,65%)]' : 'text-[hsl(220,15%,40%)]'}`}>{t.remember}</span>
                </label>

                <Link
                  to="/forgot-password"
                  className={`text-sm underline-offset-4 hover:underline ${
                    isDark ? 'text-[hsl(220,15%,65%)]' : 'text-[hsl(220,15%,40%)]'
                  }`}
                >
                  {t.forgot}
                </Link>
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
                {isSubmitting ? t.loading : t.button}
              </Button>

              <div className={`flex items-center justify-center gap-2 text-xs ${
                isDark ? 'text-[hsl(220,15%,45%)]' : 'text-[hsl(220,15%,50%)]'
              }`}>
                <span className={`inline-block h-2 w-2 rounded-full ${isDark ? 'bg-[hsl(220,15%,40%)]' : 'bg-[hsl(220,15%,50%)]'}`} />
                <span>{t.secure}</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
