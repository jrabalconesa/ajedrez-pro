/** Vector pieces avoid platform chess-font and emoji substitutions. */
export default function ChessPiece({type,color}:{type:string;color:'w'|'b'}){
 const ink=color==='w'?'#26372e':'#101d17';
 const detail=color==='w'?ink:'#ced6c7';
 return <svg className={'piece '+(color==='w'?'white-piece':'black-piece')} viewBox="0 0 48 48" aria-hidden="true" focusable="false" data-piece={color+type}>
 <g fill={color==='w'?'#fffdf2':'#263b30'} stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
 {type==='p'&&<><circle cx="24" cy="13" r="6"/><path d="M19 20h10l-2 7 5 8H16l5-8z"/></>}
 {type==='r'&&<><path d="M13 9h6v5h4V9h5v5h4V9h4v12l-5 4v10H17V25l-4-4z"/><path d="M18 22h12M20 28h8" fill="none" stroke={detail}/></>}
 {type==='n'&&<><path d="M13 35c0-9 6-13 13-17l-7 1-5 5-5-4 6-9 7-3 2-5 4 5c9 3 11 14 7 27z"/><path d="M24 11l-4 3M28 21c-4 4-7 7-8 11" fill="none" stroke={detail}/><circle cx="20" cy="14" r="1" fill={detail} stroke="none"/></>}
 {type==='b'&&<><path d="M24 7c-4 4-10 8-10 14 0 5 4 8 10 8s10-3 10-8c0-6-6-10-10-14z"/><path d="M21 27l-5 8h16l-5-8"/><path d="M27 15l-5 8" fill="none" stroke={detail}/><circle cx="24" cy="5" r="2"/></>}
 {type==='q'&&<><path d="M15 30L9 14l9 7 6-12 6 12 9-7-6 16 2 5H13z"/><circle cx="9" cy="12" r="2.4"/><circle cx="24" cy="7" r="2.4"/><circle cx="39" cy="12" r="2.4"/><path d="M17 29h14" fill="none" stroke={detail}/></>}
 {type==='k'&&<><path d="M24 4v10m-4-6h8" fill="none"/><path d="M24 16c-10-9-17 2-10 10l4 5-3 4h18l-3-4 4-5c7-8 0-19-10-10z"/><path d="M24 17v10M18 30h12" fill="none" stroke={detail}/></>}
 <path d="M15 35h18l4 6H11z"/><path d="M16 38h16" fill="none" stroke={detail}/>
 </g></svg>;
}
