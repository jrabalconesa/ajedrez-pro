import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Ajedrez PRO - Aprende, juega y mejora',description:'Tu tablero, tus variantes y tu entrenamiento con Stockfish.',manifest:'/manifest.webmanifest?v=6',appleWebApp:{capable:true,title:'Ajedrez PRO',statusBarStyle:'default'},icons:{icon:[{url:'/favicon.svg?v=6',type:'image/svg+xml'},{url:'/favicon-32-v6.png',sizes:'32x32',type:'image/png'}],apple:[{url:'/apple-touch-icon-v6.png',sizes:'180x180',type:'image/png'}]}};
export const viewport:Viewport={themeColor:'#064B32'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
