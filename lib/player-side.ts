export type PlayerColor='w'|'b';
export function validatePlayerColor(value:unknown):PlayerColor{
 if(value===undefined)return 'w';
 if(value!=='w'&&value!=='b')throw Error('Color no válido: elige blancas o negras.');
 return value;
}
export function playerColor(game?:{playerColor?:PlayerColor}|null):PlayerColor{return game?.playerColor==='b'?'b':'w';}
export function engineHasTurn(game:{playerColor?:PlayerColor;mode:string;turn:string}):boolean{return game.mode==='play'&&game.turn!==playerColor(game);}
