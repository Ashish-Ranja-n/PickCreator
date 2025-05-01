import AuthForm from '@/components/AuthForm'
import { RocketIcon } from 'lucide-react'
import React from 'react'
import Link from 'next/link'

const SignUp = () => {
  return (
    <div className='min-h-screen relative overflow-hidden bg-[#f8f9ff]'>
      {/* Modern geometric background elements */}
      <div className='absolute inset-0 bg-[url(/grid.svg)] bg-center opacity-5 pointer-events-none' />

      {/* Abstract shapes */}
      <div className='absolute top-0 right-0 w-1/3 h-screen bg-gradient-to-b from-[#f1f5ff] to-[#ffffff] transform skew-x-12 z-0' />
      <div className='absolute bottom-0 left-0 w-1/2 h-1/3 bg-gradient-to-t from-[#f0f7ff] to-transparent transform -skew-x-12 z-0' />

      {/* Animated accent elements */}
      <div className='absolute top-20 right-[20%] w-64 h-64 rounded-full border border-[#e1e8ff] opacity-20 animate-spin-slow' />
      <div className='absolute bottom-40 left-[15%] w-40 h-40 rounded-full border border-[#d8e3ff] opacity-30 animate-spin-slow' style={{animationDuration: '15s'}} />
      <div className='absolute top-[40%] left-[10%] w-20 h-20 rounded-full bg-gradient-to-r from-[#4f46e5]/5 to-[#8b5cf6]/5 animate-float' style={{animationDuration: '7s'}} />

      {/* Accent lines */}
      <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#4f46e5] via-[#8b5cf6] to-[#ec4899] opacity-80' />
      <div className='absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#4f46e5] opacity-80' />

      {/* Main content */}
      <div className='relative flex flex-col items-center justify-center min-h-screen px-4 pb-20 pt-10 z-10'>
        {/* Logo section with subtle animation */}
        <div className='mb-8 relative'>
          <div className='absolute -inset-4 bg-white/50 rounded-full blur-xl opacity-70 animate-pulse-soft' />
          <Link href="/" className="inline-flex items-center relative">
            <span className="text-3xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-[#4f46e5] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
                PICKCREATOR
              </span>
            </span>
          </Link>
        </div>

        {/* Title and tagline section */}
        <div className='text-center space-y-4 mb-6'>

          {/* Tagline with enhanced styling */}
          <div className='relative'>
            <p className='text-gray-600 font-medium leading-relaxed'>
              "Begin your creative journey today.
              <br />
              <span className='text-[#4f46e5]'>Connect, collaborate, and grow with PickCreator.</span>"
            </p>
            <div className='mt-4 flex justify-center'>
              <div className='p-3 bg-gradient-to-r from-[#4f46e5]/10 to-[#8b5cf6]/10 rounded-full relative group'>
                <div className='absolute inset-0 bg-gradient-to-r from-[#4f46e5]/20 to-[#8b5cf6]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
                <RocketIcon
                  size={36}
                  className='text-[#4f46e5] relative z-10 group-hover:text-[#8b5cf6] transition-colors duration-300'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Auth form with modern styling */}
        <div className='w-full max-w-md relative'>
          <div className='absolute -inset-1.5 bg-gradient-to-r from-[#4f46e5]/10 via-[#8b5cf6]/10 to-[#ec4899]/10 rounded-2xl blur-lg opacity-70' />
          <AuthForm type="Sign Up" />
        </div>
      </div>
    </div>
  )
}

export default SignUp