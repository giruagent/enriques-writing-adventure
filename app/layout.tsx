import type {Metadata,Viewport} from 'next';
import './style.css';
export const metadata:Metadata={title:'Enrique’s Writing Adventure',description:'A little world for a big writing adventure.',manifest:`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/manifest.webmanifest`};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#58c4c0'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
