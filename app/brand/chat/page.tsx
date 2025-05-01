"use client";

import React from 'react';
import { NextPage } from 'next';
import { ChatList } from '@/components/chat/ChatList';


const Chat: NextPage = () =>{
 
  return (
    <>
    <div>
      <ChatList />
    </div>
    </>

  )
}

export default Chat