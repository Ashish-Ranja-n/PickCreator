"use client";

import React from 'react';
import { NextPage } from 'next';
import { ChatList } from '@/components/chat/ChatList';


const Chat: NextPage = () =>{
 
  return (
    <>
    <div className="h-full pt-16 pb-20 md:pt-0 md:pb-0">
      <ChatList />
    </div>
    </>

  )
}

export default Chat