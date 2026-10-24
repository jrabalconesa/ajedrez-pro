import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Ajedrez PRO - Aprende, juega y mejora',description:'Tu tablero, tus variantes y tu entrenamiento con Stockfish.',icons:{icon:[{url:'/favicon.png?v=2',type:'image/png'}],apple:'/brand-logo.png?v=2'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
