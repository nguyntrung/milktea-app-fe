import { useState } from "react";
import { LoginForm } from "./components/login-form";
import { RegisterForm } from "./components/register-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SignInProps {
  setIsLoggedIn: (value: boolean) => void;
  setIsAdmin: (value: boolean) => void;
}

export default function AuthPage({ setIsLoggedIn, setIsAdmin }: SignInProps) {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="grid min-h-[800px] lg:grid-cols-2 bg-card h-fit w-full rounded-md p-3 shadow-md my-4">
      <div className="flex flex-col gap-4 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="register">Đăng ký</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="https://www.certifiedfinancialguardian.com/images/blog-wp-login.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-contain dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
