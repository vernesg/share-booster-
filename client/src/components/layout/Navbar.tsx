import { useState } from "react";
import { Link } from "wouter";
import { Menu, Moon, Sun, ExternalLink, Home, Settings, MessageCircle, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    const newIsDark = !isDark;
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Send className="w-5 h-5 text-primary" />
          Facebook Share-X
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink href="/" icon={<Home className="w-4 h-4" />}>Home</NavLink>
          <NavLink href="/share" icon={<Send className="w-4 h-4" />}>Share</NavLink>
          <NavLink href="/community" icon={<MessageCircle className="w-4 h-4" />}>Community</NavLink>
          <NavLink href="/admin" icon={<Settings className="w-4 h-4" />}>Admin</NavLink>
          <ExternalNavLink href="https://www.facebook.com/notfound500" icon={<ExternalLink className="w-4 h-4" />}>
            Developer
          </ExternalNavLink>
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 mt-8">
              <MobileNavLink href="/" onClick={() => setOpen(false)} icon={<Home className="w-4 h-4" />}>
                Home
              </MobileNavLink>
              <MobileNavLink href="/share" onClick={() => setOpen(false)} icon={<Send className="w-4 h-4" />}>
                Share Panel
              </MobileNavLink>
              <MobileNavLink href="/community" onClick={() => setOpen(false)} icon={<MessageCircle className="w-4 h-4" />}>
                Community Chat
              </MobileNavLink>
              <MobileNavLink href="/admin" onClick={() => setOpen(false)} icon={<Settings className="w-4 h-4" />}>
                Admin Panel
              </MobileNavLink>
              
              <Separator />
              
              <a 
                href="https://www.facebook.com/notfound500" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Developer
              </a>

              <Separator />

              <button
                onClick={() => {
                  toggleDarkMode();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <div className="flex items-center">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-secondary">
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-primary transition ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                {isDark ? "Dark" : "Light"}
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
      {icon}
      {children}
    </Link>
  );
}

function ExternalNavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
      {icon}
      {children}
    </a>
  );
}

function MobileNavLink({ href, children, onClick, icon }: { href: string; children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2 text-base hover:text-primary transition-colors">
      {icon}
      {children}
    </Link>
  );
}
