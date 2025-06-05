import AuthForm from '@/components/AuthForm'
import React from 'react'
import Link from 'next/link'

const SignUp = () => {
  return (
    <div className='min-h-screen relative overflow-hidden bg-[#f8f9ff]'>
      {/* Modern animated background */}
      <div className='absolute inset-0'>
        <div className='absolute inset-0 bg-gradient-to-br from-[#f1f5ff] via-[#ffffff] to-[#f0f7ff] opacity-70' />
        <div className='absolute inset-0 bg-[url(/grid.svg)] bg-center opacity-5' />
      </div>

      {/* Animated geometric elements */}
      <div className='absolute w-full h-full overflow-hidden'>
        {/* Floating elements */}
        <div className='absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-[#4f46e5]/10 to-[#8b5cf6]/10 rounded-full blur-3xl animate-float' style={{animationDuration: '20s'}} />
        <div className='absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-[#8b5cf6]/10 to-[#ec4899]/10 rounded-full blur-3xl animate-float' style={{animationDuration: '25s'}} />
        <div className='absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-[#ec4899]/10 to-[#4f46e5]/10 rounded-full blur-3xl animate-float' style={{animationDuration: '15s'}} />
      </div>

      {/* Header with Logo */}
      <div className='absolute top-0 left-0 p-6 z-10'>
        <div className='relative group'>
          <div className='absolute -inset-6 bg-gradient-to-r from-[#4f46e5]/20 via-[#8b5cf6]/20 to-[#ec4899]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700' />
          <Link href="/" className="relative flex items-center">
            <div className="flex items-center">
              <span className="text-4xl font-black tracking-tighter">
                <span className="bg-black bg-clip-text text-transparent">
                  pick
                </span>
                <span className="bg-gradient-to-r from-[#4f46e5] to-[#8b5cf6] bg-clip-text text-transparent">
                  creator
                </span>
              </span>
              <span className="ml-2 text-xl font-semibold text-gray-600">
                STUDIO
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className='relative flex flex-col items-center justify-center min-h-screen px-4'>
        {/* Auth form with enhanced styling */}
        <div className='w-full max-w-md relative'>
          <div className='absolute -inset-2 bg-gradient-to-r from-[#4f46e5]/10 via-[#8b5cf6]/10 to-[#ec4899]/10 rounded-2xl blur-lg opacity-70 animate-pulse' style={{animationDuration: '3s'}} />
          <AuthForm type="Sign Up" />
        </div>
      </div>

      {/* Footer Links */}
      <div className='absolute bottom-0 left-0 w-full p-6 flex justify-center items-center gap-8 text-sm text-gray-500 z-10'>
        <Link 
          href="/legal/privacy-policy" 
          className="hover:text-[#4f46e5] transition-colors duration-200"
        >
          Privacy Policy
        </Link>
        <Link 
          href="/legal/terms-conditions" 
          className="hover:text-[#4f46e5] transition-colors duration-200"
        >
          Terms & Conditions
        </Link>
      </div>
    </div>
  )
}

export default SignUp