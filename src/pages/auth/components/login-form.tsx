import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postData } from "@/lib/api";

// Reset Password Component
function ResetPasswordForm({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Validation states for reset password
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Email validation
  const validateEmail = (emailValue: string) => {
    if (!emailValue) {
      setEmailError("Email không được để trống");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setEmailError("Email không đúng định dạng");
      return false;
    }
    setEmailError("");
    return true;
  };

  // OTP validation
  const validateOTP = (otpValue: string) => {
    if (!otpValue) {
      setOtpError("Mã OTP không được để trống");
      return false;
    }
    if (otpValue.length !== 6) {
      setOtpError("Mã OTP phải có 6 chữ số");
      return false;
    }
    if (!/^\d+$/.test(otpValue)) {
      setOtpError("Mã OTP chỉ được chứa số");
      return false;
    }
    setOtpError("");
    return true;
  };

  // Password validation
  const validatePassword = (passwordValue: string) => {
    if (!passwordValue) {
      setPasswordError("Mật khẩu không được để trống");
      return false;
    }
    if (passwordValue.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    if (passwordValue.length > 50) {
      setPasswordError("Mật khẩu không được quá 50 ký tự");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmValue: string, passwordValue: string) => {
    if (!confirmValue) {
      setConfirmPasswordError("Xác nhận mật khẩu không được để trống");
      return false;
    }
    if (confirmValue !== passwordValue) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleRequestOTP = async () => {
    if (!validateEmail(email)) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await postData("/api/verify/auth/request-otp", { email });
      
      if (response.success) {
        setSuccess("OTP đã được gửi đến email của bạn!");
        setStep("otp");
      } else {
        setError(response.message || "Không thể gửi OTP. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi yêu cầu OTP:", error);
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!validateOTP(otp)) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await postData("/api/verify/auth/verify-otp", { 
        email, 
        otp 
      });
      
      if (response.success) {
        setSuccess("OTP xác thực thành công!");
        if (response.data && response.data.maNguoiDung) {
          setUserId(response.data.maNguoiDung);
        }
        setStep("password");
      } else {
        setError(response.message || "OTP không hợp lệ. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi xác thực OTP:", error);
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const isPasswordValid = validatePassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword, newPassword);
    
    if (!isPasswordValid || !isConfirmPasswordValid) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await postData("/api/auth/change-password", {
        maNguoiDung: userId,
        matKhauMoi: newPassword,
        xacNhanMatKhau: confirmPassword
      });
      
      if (response.success) {
        setSuccess("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.");
        setTimeout(() => {
          if (onBackToLogin) onBackToLogin();
        }, 2000);
      } else {
        setError(response.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi đặt lại mật khẩu:", error);
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="example@gmail.com"
          className={cn("h-12", emailError && "border-red-500")}
          required 
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) validateEmail(e.target.value);
          }}
          onBlur={(e) => validateEmail(e.target.value)}
        />
        {emailError && (
          <span className="text-sm text-red-600">{emailError}</span>
        )}
      </div>
      <Button onClick={handleRequestOTP} className="w-full h-12" disabled={isLoading}>
        {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
      </Button>
    </div>
  );

  const renderOTPStep = () => (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="otp">Mã OTP</Label>
        <Input 
          id="otp" 
          type="text" 
          placeholder="Nhập mã OTP"
          className={cn("h-12", otpError && "border-red-500")}
          required 
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, ''); // Only allow numbers
            setOtp(value);
            if (otpError) validateOTP(value);
          }}
          onBlur={(e) => validateOTP(e.target.value)}
          maxLength={6}
        />
        {otpError && (
          <span className="text-sm text-red-600">{otpError}</span>
        )}
        <p className="text-sm text-muted-foreground">
          Vui lòng kiểm tra email {email} để lấy mã OTP
        </p>
      </div>
      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1 h-12"
          onClick={() => setStep("email")}
        >
          Quay lại
        </Button>
        <Button onClick={handleVerifyOTP} className="flex-1 h-12" disabled={isLoading}>
          {isLoading ? "Đang xác thực..." : "Xác thực OTP"}
        </Button>
      </div>
    </div>
  );

  const renderPasswordStep = () => (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <Input 
          id="newPassword" 
          type="password" 
          placeholder="Nhập mật khẩu mới"
          className={cn("h-12", passwordError && "border-red-500")}
          required 
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (passwordError) validatePassword(e.target.value);
            if (confirmPassword && confirmPasswordError) {
              validateConfirmPassword(confirmPassword, e.target.value);
            }
          }}
          onBlur={(e) => validatePassword(e.target.value)}
          minLength={6}
        />
        {passwordError && (
          <span className="text-sm text-red-600">{passwordError}</span>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
        <Input 
          id="confirmPassword" 
          type="password" 
          placeholder="Nhập lại mật khẩu mới"
          className={cn("h-12", confirmPasswordError && "border-red-500")}
          required 
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmPasswordError) validateConfirmPassword(e.target.value, newPassword);
          }}
          onBlur={(e) => validateConfirmPassword(e.target.value, newPassword)}
          minLength={6}
        />
        {confirmPasswordError && (
          <span className="text-sm text-red-600">{confirmPasswordError}</span>
        )}
      </div>
      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1 h-12"
          onClick={() => setStep("otp")}
        >
          Quay lại
        </Button>
        <Button onClick={handleChangePassword} className="flex-1 h-12" disabled={isLoading}>
          {isLoading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
        </Button>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case "email":
        return "Đặt lại mật khẩu";
      case "otp":
        return "Xác thực OTP";
      case "password":
        return "Tạo mật khẩu mới";
      default:
        return "Đặt lại mật khẩu";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "email":
        return "Nhập email để nhận mã OTP xác thực";
      case "otp":
        return "Nhập mã OTP đã được gửi đến email của bạn";
      case "password":
        return "Tạo mật khẩu mới cho tài khoản của bạn";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-medium">{getStepTitle()}</h1>
        <p className="text-balance text-sm text-muted-foreground">
          {getStepDescription()}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {step === "email" && renderEmailStep()}
      {step === "otp" && renderOTPStep()}
      {step === "password" && renderPasswordStep()}

      <div className="text-center">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-sm underline-offset-4 hover:underline text-muted-foreground cursor-pointer"
        >
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  );
}

// Main LoginForm Component
interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
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
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  // Email validation function
  const validateEmail = (emailValue: string) => {
    if (!emailValue) {
      setEmailError("Email không được để trống");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setEmailError("Email không đúng định dạng");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Password validation function
  const validatePassword = (passwordValue: string) => {
    if (!passwordValue) {
      setPasswordError("Mật khẩu không được để trống");
      return false;
    }
    if (passwordValue.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    if (passwordValue.length > 50) {
      setPasswordError("Mật khẩu không được quá 50 ký tự");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Form validation
  const validateForm = () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(matKhau);
    setTouched({ email: true, password: true });
    return isEmailValid && isPasswordValid;
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");
    const userId = query.get("userId");
    const role = query.get("role");
    const error = query.get("error");

    if (error) {
      setError("Đăng nhập với Google thất bại. Vui lòng thử lại.");
      return;
    }

    if (token && userId && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);
      if (setIsLoggedIn) setIsLoggedIn(true);
      if (setIsAdmin) setIsAdmin(role === "admin");
      navigate(role === "admin" ? "/admin" : "/");
    }
  }, [location, setIsLoggedIn, setIsAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  if (showResetPassword) {
    return (
      <ResetPasswordForm 
        onBackToLogin={() => setShowResetPassword(false)}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-medium">Đăng nhập vào tài khoản</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Nhập email của bạn để đăng nhập
        </p>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="example@gmail.com"
            className={cn("h-12", emailError && touched.email && "border-red-500")}
            required 
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email || emailError) {
                validateEmail(e.target.value);
              }
            }}
            onBlur={(e) => {
              setTouched(prev => ({ ...prev, email: true }));
              validateEmail(e.target.value);
            }}
          />
          {emailError && touched.email && (
            <span className="text-sm text-red-600">{emailError}</span>
          )}
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Mật khẩu</Label>
          </div>
          <Input 
            id="password" 
            type="password" 
            className={cn("h-12", passwordError && touched.password && "border-red-500")}
            required 
            value={matKhau}
            onChange={(e) => {
              setMatKhau(e.target.value);
              if (touched.password || passwordError) {
                validatePassword(e.target.value);
              }
            }}
            onBlur={(e) => {
              setTouched(prev => ({ ...prev, password: true }));
              validatePassword(e.target.value);
            }}
          />
          {passwordError && touched.password && (
            <span className="text-sm text-red-600">{passwordError}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowResetPassword(true)}
          className="ml-auto text-sm underline-offset-4 hover:underline cursor-pointer"
        >
          Quên mật khẩu?
        </button>
        <Button 
          type="submit"
          className="w-full h-12 cursor-pointer" 
          disabled={isLoading}
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Hoặc tiếp tục với
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full h-12 cursor-pointer"
          type="button"
          onClick={handleGoogleLogin}
        >
          <img 
            src="https://images.seeklogo.com/logo-png/15/2/google-chrome-logo-png_seeklogo-157975.png"
            alt="Google logo" 
            className="w-5 h-5"
          />
          Đăng nhập với Google
        </Button>
      </form>
    </div>
  );
}
