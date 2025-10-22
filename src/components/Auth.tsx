import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export const Auth = () => {
  const supabase = getSupabase();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data: signUpRes, error: signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) throw signUpErr;
        // If email confirmations are enabled, there will be no session yet.
        if (!signUpRes.session) {
          setError("Check your email to confirm your account, then sign in.");
          toast({ title: "Verification sent", description: "Check your email to confirm your account." });
          return; // stop here; cannot write profile without a session
        }
        const userId = signUpRes.user?.id;
        if (userId) {
          await supabase.from("user_profiles").upsert({ id: userId, email, username: fullName || null, created_at: new Date().toISOString() }).throwOnError();
        }
        toast({ title: "Account created", description: "You are now signed in." });
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        toast({ title: "Signed in", description: "Welcome back!" });
        // ensure profile exists (first login after confirmed signup)
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes.user?.id;
        if (userId) {
          await supabase.from("user_profiles").upsert({ id: userId, email, username: fullName || null }).throwOnError();
        }
      }
      // Double-check we actually have a valid session before redirecting
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Authentication failed: no active session returned.");
      }
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
      toast({ title: "Auth error", description: err?.message || "Authentication failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <Card className="w-full max-w-md bg-gray-900 text-white border border-gray-800">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Gold Crafts Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button variant={mode === "signin" ? "default" : "ghost"} className="flex-1" onClick={() => setMode("signin")}>Sign In</Button>
            <Button variant={mode === "signup" ? "default" : "ghost"} className="flex-1" onClick={() => setMode("signup")}>Sign Up</Button>
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="block mb-1 text-sm">Full Name</label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-white text-gray-900" />
              </div>
            )}
            <div>
              <label className="block mb-1 text-sm">Email</label>
              <Input type="email" inputMode="email" autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@example.com" className="bg-white text-gray-900 placeholder:text-gray-400" />
            </div>
            <div>
              <label className="block mb-1 text-sm">Password</label>
              <Input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="bg-white text-gray-900" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Please wait..." : mode === "signup" ? "Sign Up" : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;


