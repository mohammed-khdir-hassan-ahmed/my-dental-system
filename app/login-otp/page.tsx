'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, ArrowLeft, Lock, ShieldCheck, KeyRound } from "lucide-react";
import Image from 'next/image';
import { notifyLoginSuccess, notifyLoginError } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginOTP() {
    const router = useRouter();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) {
            value = value[0];
        }
        
        const newCode = [...code];
        newCode[index] = value.toUpperCase();
        setCode(newCode);
        
        // Clear error when user starts typing
        if (error) {
            setError(false);
        }

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).toUpperCase();
        const newCode = [...code];
        for (let i = 0; i < pastedData.length; i++) {
            newCode[i] = pastedData[i];
        }
        setCode(newCode);
    };

    const handleOTPLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.join('') }),
            });

            const data = await response.json();

            if (response.ok) {
                setCode(['', '', '', '', '', '']);
                setError(false);
                notifyLoginSuccess();
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            } else {
                setCode(['', '', '', '', '', '']);
                setError(true);
                notifyLoginError('کۆدی تایبەت هەڵەیە');
            }
        } catch (error) {
            console.error('OTP Login error:', error);
            notifyLoginError('هەڵەیەک ڕویدا لە سێرڤەر');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col md:flex-row h-auto md:h-screen w-full bg-white'>
            {/* Left Side - Image (50%) - Hidden on mobile */}
            <div className='hidden md:flex w-full md:w-1/2 h-64 md:h-full relative overflow-hidden'>
                <Image 
                    src="/images/main.jpg" 
                    alt="Login Image" 
                    fill
                    className='object-cover shadow-2xl transition-transform duration-500 hover:scale-105'
                    priority
                />
                {/* Gradient Overlay */}
                <div className='absolute inset-0 from-transparent via-transparent rounded-tr-[40px] rounded-br-[40px]' />
                
                {/* Premium Frosted Glass Card Overlay */}
                <div className='absolute bottom-8 left-6 right-6 px-8 py-5 backdrop-blur-xl bg-white/10 border border-white/20 text-white rounded-2xl shadow-2xl' dir='rtl'>
                    <p className='text-sm leading-relaxed text-center font-light tracking-wide'>
                        ئێمە لێرەین بۆ پێشکەشکردنی بەرزترین کوالێتی و چارەسەر ، بە گەرەنتییەکی تەواو و هەمیشەیی بۆ ئەوەی خەندەیەکی تەندروست و بێ وێنەت پێ ببەخشینـــ
                    </p>
                </div>
            </div>

            {/* Right Side - OTP Login Form (50%) */}
            <div className='w-full md:w-1/2 min-h-screen md:h-full flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 py-12 md:py-0'>
                <div className='w-full max-w-2xl sm:max-w-lg md:max-w-md animate-fade-in' dir='rtl'>
                  

                    {/* Header with Icon */}
                    <div className='text-center mb-10'>
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
                            <KeyRound className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className='text-3xl font-bold mb-2 text-gray-900'> چونەژوورەوە بە کۆدی <span className='text-primary'>OTP</span></h1>
                        <p className='text-gray-500 text-sm'> کۆدی تایبەت بنووسە بۆ چونەژوورەوە </p>
                    </div>
                    
                    {/* Form */}
                    <form className='space-y-6' onSubmit={handleOTPLogin}>
                        <div className='space-y-3'>
                           
                            <div className="flex gap-3 justify-center" dir="ltr">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <input
                                    key={index}
                                    ref={(el: any) => {
                                        if (el) {
                                            inputRefs.current[index] = el;
                                        }
                                    }}
                                    type="text"
                                    maxLength={1}
                                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                                        error 
                                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                                            : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
                                    }`}
                                    value={code[index]}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    disabled={loading}
                                    autoComplete="off"
                                />
                            ))}
                        </div>
                        </div>

                        <Button 
                            type='submit'
                            className='w-full text-white font-semibold text-base h-12 bg-primary hover:bg-primary/90 transition-all duration-300 rounded-lg shadow-md hover:shadow-lg' 
                            size='lg'
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
                                    چونەژوورەوە...
                                </div>
                            ) : (
                                <>
                                    <LogIn className='ml-2 h-5 w-5' />
                                    چونەژوورەوە
                                </>
                            )}
                        </Button>

                        <p className='text-center text-sm text-gray-600 mt-6'>
                            هەژمارت نیە؟ <a href='/login' className='text-primary hover:text-primary/80 font-semibold transition-colors duration-300'>چونەژوورەوە بە ئیمەیڵ</a>
                        </p>
                    </form>

                    {/* Security Info */}
                    <div className="mt-8 flex items-center justify-center text-gray-400 text-sm">
                        <ShieldCheck className="w-4 h-4 ml-2" />
                        کۆدی تایبەت پارێزراوە و تەنها لەلایەن دکتۆرەوە بەکاردەهێنرێت
                    </div>
                </div>
            </div>
        </div>
    );
}
