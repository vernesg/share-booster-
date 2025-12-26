import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adminLoginSchema, type AdminLoginRequest } from "@shared/routes";
import { useAdminLogin, useAuthCheck } from "@/hooks/use-auth";
import { useUpdateSetting, useSetting } from "@/hooks/use-settings";
import { queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Key, Lock, User, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { data: auth, isLoading: isCheckingAuth } = useAuthCheck();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 w-full p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-full">
          {auth?.authenticated ? (
            <AdminDashboard onLogout={() => setShowLogoutConfirm(true)} />
          ) : (
            <LoginForm />
          )}
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Logout?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Are you sure you want to logout?</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleLogout}
                  className="flex-1"
                  data-testid="button-confirm-logout"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function LoginForm() {
  const loginMutation = useAdminLogin();
  const form = useForm<AdminLoginRequest>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { username: "", password: "" }
  });

  const onSubmit = (data: AdminLoginRequest) => {
    loginMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Admin Access</CardTitle>
        <CardDescription>Enter your credentials to manage the premium key</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="w-4 h-4" /> Username
            </Label>
            <Input 
              id="username"
              {...form.register("username")}
              data-testid="input-admin-username"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Key className="w-4 h-4" /> Password
            </Label>
            <Input 
              id="password"
              type="password"
              {...form.register("password")}
              data-testid="input-admin-password"
              autoComplete="current-password"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loginMutation.isPending}
            data-testid="button-admin-login"
          >
            {loginMutation.isPending ? "Authenticating..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const { data: currentKey, isLoading, refetch } = useSetting("premium_key");
  const { data: adminUsername } = useSetting("admin_username");
  const { data: adminPassword } = useSetting("admin_password");
  const updateMutation = useUpdateSetting();
  const [newKey, setNewKey] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showKeyVisible, setShowKeyVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("key");

  const handleUpdate = async (type: string) => {
    let key = "";
    let value = "";

    if (type === "key" && newKey.trim()) {
      key = "premium_key";
      value = newKey;
    } else if (type === "username" && newUsername.trim()) {
      key = "admin_username";
      value = newUsername;
    } else if (type === "password" && newPassword.trim()) {
      key = "admin_password";
      value = newPassword;
    } else {
      toast({
        title: "Error",
        description: "Field cannot be empty",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({ key, value }, {
      onSuccess: () => {
        if (type === "key") setNewKey("");
        if (type === "username") setNewUsername("");
        if (type === "password") setNewPassword("");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        refetch();
        toast({
          title: "Success",
          description: `${type} updated successfully`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: `Failed to update ${type}`,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header with Logout */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <h1 className="text-3xl font-bold">Admin Control Panel</h1>
          <p className="text-muted-foreground">Manage all system settings including keys, credentials, and events</p>
        </div>
        <Button 
          variant="outline" 
          onClick={onLogout}
          className="shrink-0"
          data-testid="button-logout"
        >
          Logout
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("key")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "key" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
        >
          Premium Key
        </button>
        <button
          onClick={() => setActiveTab("credentials")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "credentials" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
        >
          Admin Credentials
        </button>
      </div>

      {/* Premium Key Tab */}
      {activeTab === "key" && (
        <>
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Premium Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border-2 flex items-center justify-between transition-all ${showSuccess ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700" : "bg-secondary border-transparent"}`}>
                <div className="flex items-center gap-3 flex-1">
                  <Key className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Active Key</p>
                    {isLoading ? (
                      <p className="text-sm">Loading...</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-bold">
                          {showKeyVisible ? currentKey?.value : (currentKey?.value ? `••••${currentKey.value.slice(-4)}` : "Not Set")}
                        </code>
                        {showSuccess && <Check className="w-4 h-4 text-green-600 dark:text-green-400" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Update Premium Key</CardTitle>
              <CardDescription>
                Enter a new key and it will be updated in real-time across the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-key" className="text-base font-semibold">New Key Value</Label>
                <div className="flex gap-2">
                  <Input 
                    id="new-key"
                    type={showKeyVisible ? "text" : "password"}
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !updateMutation.isPending && handleUpdate("key")}
                    placeholder="Enter new premium key..."
                    className="font-mono"
                    data-testid="input-new-premium-key"
                  />
                  <Button 
                    onClick={() => handleUpdate("key")}
                    disabled={!newKey.trim() || updateMutation.isPending}
                    className="font-semibold"
                    data-testid="button-update-key"
                  >
                    {updateMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="show-key" 
                    checked={showKeyVisible}
                    onChange={(e) => setShowKeyVisible(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="show-key" className="text-xs text-muted-foreground cursor-pointer">
                    Show key value
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Credentials Tab */}
      {activeTab === "credentials" && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Admin Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-secondary rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                <p className="font-mono font-semibold">{adminUsername?.value || "Not set"}</p>
              </div>
              <div className="p-3 bg-secondary rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Password</p>
                <p className="font-mono font-semibold">••••••••</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Update Admin Credentials</CardTitle>
              <CardDescription>
                Change your admin username and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-username" className="text-base font-semibold">New Username</Label>
                <div className="flex gap-2">
                  <Input 
                    id="new-username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username..."
                    data-testid="input-new-username"
                  />
                  <Button 
                    onClick={() => handleUpdate("username")}
                    disabled={!newUsername.trim() || updateMutation.isPending}
                    data-testid="button-update-username"
                  >
                    {updateMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-base font-semibold">New Password</Label>
                <div className="flex gap-2">
                  <Input 
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    data-testid="input-new-password"
                  />
                  <Button 
                    onClick={() => handleUpdate("password")}
                    disabled={!newPassword.trim() || updateMutation.isPending}
                    data-testid="button-update-password"
                  >
                    {updateMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
