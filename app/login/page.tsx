'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from "lucide-react";
import Image from 'next/image';
import { notifyLoginSuccess, notifyLoginError } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setEmail('');
                setPassword('');
                notifyLoginSuccess();
                // Redirect after 2 seconds
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            } else {
                notifyLoginError('یوزەرنەیم یان پاسۆرد هەڵەیە');
            }
        } catch (error) {
            console.error('Login error:', error);
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

            {/* Right Side - Login Form (50%) */}
            <div className='w-full md:w-1/2 min-h-screen md:h-full flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 py-12 md:py-0'>
                <div className='w-full max-w-2xl sm:max-w-lg md:max-w-md animate-fade-in' dir='rtl'>
                    <div className='text-center mb-8'>
                        <h1 className='text-4xl sm:text-4xl md:text-5xl font-bold mb-2 text-gray-900'> بەخێربێیتــــ👋</h1>
                        <p className='text-base sm:text-base md:text-lg text-gray-500 font-medium'> تەندروستی ددانتان ، خەندەی ئێمەیە </p>
                    </div>
                    
                    <form className='space-y-5' onSubmit={handleLogin}>
                        <div className='space-y-2'>
                            <label className='block text-sm font-semibold text-gray-700'>ئیمەیڵ</label>
                            <Input 
                                type='email' 
                                placeholder='ئیمەیڵەکەت بنووسە'
                                className='w-full text-base h-12 px-4 border-2 border-gray-200 rounded-lg text-black transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                title='تکایە ئیمەیڵ بنووسە'
                            />
                        </div>

                        <div className='space-y-2'>
                            <label className='block text-sm font-semibold text-gray-700'>وشەی نهێنی</label>
                            <Input 
                                type='password' 
                                placeholder='وشەی نهێنیت بنووسە'
                                className='w-full text-base h-12 px-4 border-2 border-gray-200 text-black rounded-lg transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder-gray-400'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                title='تکایە وشەی نهێنی بنووسە'
                            />
                        </div>

                        <Button 
                            type='submit'
                            className='w-full mt-8 text-white font-semibold text-base h-12 bg-primary hover:bg-primary/90 transition-all duration-300 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100' 
                            size='lg'
                            disabled={loading}
                        >
                            <LogIn className='ml-2 h-5 w-5' />
                            {loading ? 'چونەژوورەوە...' : 'چونەژوورەوە'}
                        </Button>

                        <p className='text-center text-sm text-gray-600 mt-6'>
                         هەژمارت نیە؟ <a href='/login-otp' className='text-primary hover:text-primary/80 font-semibold transition-colors duration-300'>چونەژوورەوە لەڕێگای کۆدی تایبەتەوە</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
