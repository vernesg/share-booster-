import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, Users } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const messageSchema = z.object({
  message: z.string().min(1),
});

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;
type MessageData = z.infer<typeof messageSchema>;

export default function Community() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", displayName: "" }
  });

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" }
  });

  const messageForm = useForm<MessageData>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" }
  });

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat/messages");
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      console.error("Error fetching messages:", e);
    }
  };

  const onRegister = async (data: RegisterData) => {
    try {
      const res = await fetch("/api/chat/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Registration failed");
      }
      setCurrentUser(responseData);
      setIsRegistering(false);
      registerForm.reset();
      toast({ title: "Success", description: "Account created successfully!" });
    } catch (e: any) {
      toast({ title: "Registration Error", description: e.message || "Failed to register", variant: "destructive" });
      console.error("Registration error:", e);
    }
  };

  const onLogin = async (data: LoginData) => {
    try {
      const res = await fetch("/api/chat/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Login failed");
      }
      setCurrentUser(responseData.user);
      loginForm.reset();
      toast({ title: "Success", description: "Logged in successfully!" });
    } catch (e: any) {
      toast({ title: "Login Error", description: e.message || "Login failed", variant: "destructive" });
      console.error("Login error:", e);
    }
  };

  const onSendMessage = async (data: MessageData) => {
    if (!currentUser) {
      toast({ title: "Error", description: "Please login first", variant: "destructive" });
      return;
    }
    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          message: data.message,
        })
      });
      messageForm.reset();
      await fetchMessages();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-4 flex gap-8">
          {!isRegistering ? (
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" /> Login to Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <Input placeholder="Username" {...loginForm.register("username")} />
                  <Input type="password" placeholder="Password" {...loginForm.register("password")} />
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Login</Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsRegistering(true)}>
                      Register
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" /> Create Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <Input placeholder="Username" {...registerForm.register("username")} />
                  <Input type="email" placeholder="Email" {...registerForm.register("email")} />
                  <Input type="password" placeholder="Password" {...registerForm.register("password")} />
                  <Input placeholder="Display Name" {...registerForm.register("displayName")} />
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">Create Account</Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsRegistering(false)}>
                      Back to Login
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Community Chat</h1>
          <Button variant="outline" onClick={() => setCurrentUser(null)}>Logout</Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-muted-foreground">No messages yet</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="border-b pb-3">
                    <p className="font-semibold text-sm">{msg.displayName}</p>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={messageForm.handleSubmit(onSendMessage)} className="space-y-4">
                <Textarea placeholder="Type your message..." {...messageForm.register("message")} />
                <Button type="submit" className="w-full">
                  <Send className="w-4 h-4 mr-2" /> Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
