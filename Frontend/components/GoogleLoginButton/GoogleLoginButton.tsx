"use client";

import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/AuthContext";
import { useState } from "react";

export default function GoogleLoginButton() {
  const { googleLogin } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      if (!credentialResponse.credential) {
        throw new Error("No credential provided from Google");
      }

      // Gọi hàm đăng nhập Google từ AuthContext
      await googleLogin(credentialResponse.credential);

      message.success("Đăng nhập bằng Google thành công!");

      // Chuyển hướng về trang chủ sau một khoảng ngắn
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Đăng nhập thất bại";
      console.error("Lỗi đăng nhập Google:", errorMessage);
      message.error(`Lỗi: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    console.error("Đã xảy ra lỗi khi đăng nhập Google");
    message.error("Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
  };

  const handleIsUnsupported = () => {
    console.warn("Chức năng One Tap Sign-in không được hỗ trợ");
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          text="signin_with"
          width="100%"
        />
      ) : (
        <div style={{ color: "red", textAlign: "center" }}>
          <p>⚠️ Google login is not configured</p>
          <p style={{ fontSize: "12px" }}>
            Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local
          </p>
        </div>
      )}
    </div>
  );
}