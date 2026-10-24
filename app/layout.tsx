import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Ajedrez PRO - Aprende, juega y mejora',description:'Tu tablero, tus variantes y tu entrenamiento con Stockfish.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
