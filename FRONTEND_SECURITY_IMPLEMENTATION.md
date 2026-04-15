# Frontend Implementation Guide - Security Features

## Overview
Hướng dẫn cài đặt các trang Frontend cần thiết cho:
- Email Verification
- Password Reset
- Two-Factor Authentication (2FA)

---

## 📋 API Service Updates (services/api.ts)

Thêm các function mới vào `services/api.ts`:

```typescript
// ============ EMAIL VERIFICATION ============
export const verifyEmail = async (token: string) => {
  const response = await api.post('/auth/verify-email', { token });
  return response.data;
};

export const resendVerificationEmail = async (email: string) => {
  const response = await api.post('/auth/resend-verification-email', { email });
  return response.data;
};

// ============ PASSWORD RESET ============
export const forgotPassword = async (email: string) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await api.post('/auth/reset-password', { 
    token, 
    newPassword 
  });
  return response.data;
};

// ============ TWO-FACTOR AUTHENTICATION ============
export const setup2FA = async () => {
  return api.get('/auth/2fa/setup', {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  });
};

export const confirm2FA = async (totpCode: string, secret: string) => {
  return api.post('/auth/2fa/confirm', { totpCode, secret }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  });
};

export const verify2FACode = async (userId: string, totpCode?: string, backupCode?: string) => {
  return api.post('/auth/2fa/verify', { 
    userId, 
    ...(totpCode && { totpCode }),
    ...(backupCode && { backupCode })
  });
};

export const disable2FA = async (password: string) => {
  return api.post('/auth/2fa/disable', { password }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  });
};
```

---

## 📄 New Frontend Pages

### 1. `/verify-email` - Email Verification Page

**File**: `app/verify-email/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/services/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token');
      return;
    }

    // Gọi API verify
    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && <p>Verifying email...</p>}
        {status === 'success' && <p className="text-green-600">{message}</p>}
        {status === 'error' && <p className="text-red-600">{message}</p>}
      </div>
    </div>
  );
}
```

---

### 2. `/forgot-password` - Password Reset Request

**File**: `app/forgot-password/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { forgotPassword } from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await forgotPassword(email);
      setMessage('If this email exists, you will receive a password reset link');
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {message && <p className="text-green-600 mt-4">{message}</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
}
```

---

### 3. `/reset-password` - Password Reset Form

**File**: `app/reset-password/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/services/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(token!, newPassword);
      // Redirect to login
      router.push('/login?message=Password reset successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Missing reset token</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
}
```

---

### 4. `/setup-2fa` - Two-Factor Authentication Setup

**File**: `app/setup-2fa/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setup2FA, confirm2FA } from '@/services/api';

export default function Setup2FAPage() {
  const router = useRouter();
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secret, setSecret] = useState('');

  // Step 1: Get QR Code
  useEffect(() => {
    const getQRCode = async () => {
      try {
        const response = await setup2FA();
        setQrCodeUrl(response.data.qrCodeUrl);
        setManualEntryKey(response.data.manualEntryKey);
        // Save secret for next step
        localStorage.setItem('2fa_temp_secret', response.data.manualEntryKey);
        setSecret(response.data.manualEntryKey);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to get QR code');
      }
    };

    getQRCode();
  }, []);

  // Step 2: Verify TOTP Code
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await confirm2FA(totpCode, secret);
      setBackupCodes(response.data.backupCodes);
      setStep('backup');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid TOTP code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Save Backup Codes
  const handleComplete = () => {
    localStorage.removeItem('2fa_temp_secret');
    router.push('/dashboard?2fa=enabled');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Setup 2FA</h1>

        {step === 'qr' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with Google Authenticator, Authy, or Microsoft Authenticator
            </p>
            
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="w-full border p-2" />
            )}
            
            <div>
              <p className="text-sm font-semibold mb-2">Or enter manually:</p>
              <code className="bg-gray-100 p-3 block text-center font-mono text-sm">
                {manualEntryKey}
              </code>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
            
            <input
              type="text"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.slice(0, 6))}
              maxLength={6}
              className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest"
              autoFocus
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <p className="text-sm text-red-600 font-semibold">
              ⚠️ Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator app.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-lg space-y-2">
              {backupCodes.map((code, idx) => (
                <code key={idx} className="block font-mono text-sm">
                  {code}
                </code>
              ))}
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-green-600 text-white py-2 rounded-lg"
            >
              I have saved my backup codes
            </button>
          </div>
        )}

        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
}
```

---

### 5. `/verify-2fa` - 2FA Verification During Login

**File**: `app/verify-2fa/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verify2FACode } from '@/services/api';

export default function Verify2FAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [codeType, setCodeType] = useState<'totp' | 'backup'>('totp');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userId = searchParams.get('userId');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verify2FACode(
        userId!,
        codeType === 'totp' ? code : undefined,
        codeType === 'backup' ? code : undefined
      );
      
      // Get access token and redirect
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Missing user information</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Two-Factor Authentication</h1>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="flex gap-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="totp"
                checked={codeType === 'totp'}
                onChange={(e) => setCodeType(e.target.value as 'totp' | 'backup')}
              />
              <span className="ml-2">Authenticator code</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="backup"
                checked={codeType === 'backup'}
                onChange={(e) => setCodeType(e.target.value as 'totp' | 'backup')}
              />
              <span className="ml-2">Backup code</span>
            </label>
          </div>

          <input
            type="text"
            placeholder={codeType === 'totp' ? '000000' : 'XXXXXXXXXX'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={codeType === 'totp' ? 6 : 10}
            className="w-full px-4 py-2 border rounded-lg"
            autoFocus
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
}
```

---

## 🔗 Update Existing Pages

### Login Page - Add 2FA Check

Cập nhật `app/login/page.tsx`:

```typescript
// Trong login handler:
const handleLogin = async (e: React.FormEvent) => {
  // ... email/password validation
  
  try {
    const response = await login(email, password);
    
    // Check if 2FA is required
    if (response.data.requires2FA) {
      // Redirect to 2FA verification
      router.push(`/verify-2fa?userId=${response.data.userId}`);
      return;
    }
    
    // Regular login success
    localStorage.setItem('accessToken', response.data.accessToken);
    router.push('/dashboard');
  } catch (error) {
    setError('Login failed');
  }
};
```

### Register Page - Add Email Verification

Cập nhật `app/register/page.tsx`:

```typescript
// Sau khi đăng ký thành công:
const handleRegister = async (e: React.FormEvent) => {
  try {
    await registerUser(name, email, password);
    
    // Show message và redirect
    setMessage('Account created! Please check your email to verify your account.');
    setTimeout(() => router.push('/login'), 3000);
  } catch (error) {
    setError('Registration failed');
  }
};
```

### Settings/Profile Page - Add 2FA Toggle

```typescript
export const TwoFactorSettings = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [password, setPassword] = useState('');

  const handleDisable2FA = async () => {
    try {
      await disable2FA(password);
      setIs2FAEnabled(false);
      setPassword('');
      setShowDisableForm(false);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-3">Two-Factor Authentication</h3>
      
      {is2FAEnabled ? (
        <>
          <p className="text-green-600 mb-3">✓ 2FA is enabled</p>
          
          {showDisableForm && (
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Confirm your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <button
                onClick={handleDisable2FA}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Disable 2FA
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowDisableForm(!showDisableForm)}
            className="text-red-600"
          >
            Disable 2FA
          </button>
        </>
      ) : (
        <button
          onClick={() => window.location.href = '/setup-2fa'}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Enable 2FA
        </button>
      )}
    </div>
  );
};
```

---

## 🧪 Testing Checklist

- [ ] Email verification flow works end-to-end
- [ ] Resend verification email works
- [ ] Forgot password email sent correctly
- [ ] Reset password with token works
- [ ] 2FA QR code scans correctly
- [ ] TOTP code verification works
- [ ] Backup codes work as fallback
- [ ] 2FA check during login works
- [ ] Disable 2FA works
- [ ] All email templates render correctly

---

## 📝 Notes

- Store temporary secrets in sessionStorage, not localStorage
- Clear 2FA temp data after successful verify
- Show backup code warning prominently
- Implement rate limiting on verify endpoints
- Add proper error handling and user feedback
