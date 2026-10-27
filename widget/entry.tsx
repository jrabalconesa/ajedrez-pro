import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from '@modelcontextprotocol/ext-apps';
import ChessApp from '../app/chess-app';
const app=new App({name:'Ajedrez PRO',version:'1.4.0'},{availableDisplayModes:['inline','fullscreen']});
const actions:any={aia:'adaptive_learning',get:'get_game',list:'list_games',new:'start_game',move:'play_move',branch_move:'change_move',seek:'seek_position',fork:'fork_game',open:'open_game',settings:'game_settings',mode:'game_mode',import:'import_pgn',resign:'resign_game',resign_and_new:'resign_and_restart',analysis:'save_analysis',request_analysis:'request_analysis'};
window.__CHESS_BRIDGE__={call:async(action,args={})=>{const r:any=await app.callServerTool({name:actions[action],arguments:args});if(r.isError)throw Error(r.content?.[0]?.text||'No se pudo completar la acción');return r.structuredContent;},context:state=>app.updateModelContext({structuredContent:state,content:[{type:'text',text:JSON.stringify(state),annotations:{audience:['assistant']}}]}),ask:text=>app.sendMessage({role:'user',content:[{type:'text',text}]}),engineSource:(window as any).__ENGINE_SOURCE__};
app.ontoolresult=()=>{};
app.connect().then(()=>createRoot(document.getElementById('root')!).render(<ChessApp/>)).catch(e=>{document.getElementById('root')!.textContent='No se pudo conectar el tablero: '+e.message});
