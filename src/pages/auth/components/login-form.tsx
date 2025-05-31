import { useState } from "react"
import { useNavigate } from "react-router"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Chrome } from "lucide-react"
import { postData } from "@/lib/api"

interface LoginFormProps extends React.ComponentPropsWithoutRef<"form"> {
  className?: string;
  setIsLoggedIn?: (value: boolean) => void;
  setIsAdmin?: (value: boolean) => void;
}

export function LoginForm({
  className,
  setIsLoggedIn,
  setIsAdmin,
  ...props
}: LoginFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await postData("/api/auth/login", { email, matKhau });
      
      console.log("API response:", response);
      
      if (response.success) {
        const token = response.data.token;
        const role = response.data.user.vaiTro;
        const userId = response.data.user._id;

        console.log("Token:", token);
      
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("userId", userId);
      
        if (setIsLoggedIn) setIsLoggedIn(true);
        if (setIsAdmin) setIsAdmin(role === "admin");
        navigate(role === "admin" ? "/admin" : "/");
      } else {
        setError(response.message || "Đăng nhập thất bại!");
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Đăng nhập vào tài khoản</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Nhập email của bạn để đăng nhập
        </p>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="example@gmail.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Mật khẩu</Label>
          </div>
          <Input 
            id="password" 
            type="password" 
            required 
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
          />
        </div>
        <a
          href="#"
          className="ml-auto text-sm underline-offset-4 hover:underline"
        >
          Quên mật khẩu?
        </a>
        <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Hoặc tiếp tục với
          </span>
        </div>
        <Button variant="outline" className="w-full cursor-pointer" type="button">
          <Chrome />
          Đăng nhập với Google
        </Button>
      </div>
    </form>
  )
}
