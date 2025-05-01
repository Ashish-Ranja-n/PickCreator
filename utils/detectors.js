
import { useState, useEffect } from 'react'


export function UseIsMobile() {
    const [isMobile, setIsMobile] = useState(false)
useEffect(() => {
    
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
      
    if (screenWidth < 600) {
      setIsMobile(true)
    } else {
      setIsMobile(false)  
    }
}, [])

return isMobile;

}
