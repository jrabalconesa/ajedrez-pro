import React from 'react';
import {createRoot} from 'react-dom/client';
import ChessApp from '../app/chess-app';
import {localExecute} from '../lib/local-game-service';
window.__CHESS_BRIDGE__={kind:'local',call:async(action,args)=>localExecute(localStorage,action,args),context:async()=>{},ask:async()=>{}};
createRoot(document.getElementById('root')!).render(<ChessApp/>);
