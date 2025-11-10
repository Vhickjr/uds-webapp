import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { InventoryList } from "@/components/InventoryList";
import { AdminPanel } from "@/components/AdminPanel";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyBorrowings from "@/components/MyBorrowings";
import ProjectIdeaGenerator from "@/components/ProjectIdeaGenerator";
import "../styles/grid-pattern.css";

const Index = () => {
  const { user, logout, isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-background circuit-pattern">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <img src="/favicon.png" rel="Design studio Logo" className="h-16 w-16 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Unilag Design Studio</h1>
              <p className="text-xs text-muted-foreground">Inventory System</p>
            </div>
            <div className="ml-auto text-right">
              {isAuthenticated ? (
                <div className="text-sm">
                  <div className="font-medium">{user?.username}</div>
                  <div className="text-xs text-muted-foreground">{user?.role}</div>
                  <button onClick={() => logout()} className="text-xs text-red-500 mt-1">Logout</button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Not signed in</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Inventory
            </TabsTrigger>
            {user?.role === "user" && (
              <TabsTrigger value="myborrowings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                My Borrowings
              </TabsTrigger>
            )}
            {user?.role === "backoffice" && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Admin
              </TabsTrigger>
            )}
            {isAuthenticated && (
              <TabsTrigger value="ideas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Idea Generator
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryList />
          </TabsContent>

          {user?.role === "user" && (
            <TabsContent value="myborrowings">
              <MyBorrowings />
            </TabsContent>
          )}

          {user?.role === "backoffice" && (
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          )}

          {isAuthenticated && (
            <TabsContent value="ideas">
              <ProjectIdeaGenerator />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
