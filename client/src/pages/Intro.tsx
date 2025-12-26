import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Users, Lock, Zap, MessageCircle, Settings } from "lucide-react";

export default function Intro() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <Send className="w-8 h-8 text-primary" />,
      title: "Smart Share System",
      description: "Fast and efficient Facebook sharing with Normal and Premium modes"
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Premium Mode",
      description: "40 shares per batch with anti-ban optimization and 10s cooldown"
    },
    {
      icon: <Lock className="w-8 h-8 text-primary" />,
      title: "Secure Access",
      description: "Premium key management system with real-time updates"
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-primary" />,
      title: "Community Chat",
      description: "Connect with users in real-time with photo sharing support"
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "User Profiles",
      description: "Customize your profile with bio and avatar"
    },
    {
      icon: <Settings className="w-8 h-8 text-primary" />,
      title: "Admin Panel",
      description: "Complete control over system settings and keys"
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Hero Section */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Send className="w-12 h-12 text-primary" />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Facebook Share-X
              </h1>
            </div>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Professional Facebook auto-sharing tool with advanced features and community integration
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                onClick={() => setLocation("/share")}
                className="text-base font-semibold"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setLocation("/community")}
                className="text-base font-semibold"
              >
                Join Community
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-3">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Version Section */}
      <section className="border-t bg-secondary/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Facebook Share-X</h3>
          <p className="text-muted-foreground mb-4">v1.0.0 - Production Ready</p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            A comprehensive Facebook sharing solution with real-time community features, secure admin controls, and premium optimization
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground">
            Try the sharing system with 3 free premium trials before you need a key
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation("/share")}
            className="text-base font-semibold"
          >
            Start Sharing Now
          </Button>
        </div>
      </section>
    </div>
  );
}
