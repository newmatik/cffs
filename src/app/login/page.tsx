"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/cfi-logo.png"
              alt="Christ Followers International Logo"
              width={80}
              height={96}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Christ Followers</h1>
          <p className="text-gray-500 mt-1">Financial Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@christfollowers.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center mb-3">Demo Accounts</p>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between bg-gray-50 p-2 rounded">
                  <span className="font-medium">Admin:</span>
                  <span>admin@christfollowers.ph</span>
                </div>
                <div className="flex justify-between bg-gray-50 p-2 rounded">
                  <span className="font-medium">Officer:</span>
                  <span>maria.santos@christfollowers.ph</span>
                </div>
                <div className="flex justify-between bg-gray-50 p-2 rounded">
                  <span className="font-medium">Member:</span>
                  <span>juan.delacruz@christfollowers.ph</span>
                </div>
                <p className="text-center text-gray-400 mt-1">Password: password123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
