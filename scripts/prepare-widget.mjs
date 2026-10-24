import fs from 'node:fs';import {build} from 'esbuild';
const source=fs.readFileSync('public/engine/stockfish.js','utf8');
fs.writeFileSync('lib/generated/engine-source.ts','export const engineSource='+JSON.stringify(source)+';\n');
const result=await build({entryPoints:['widget/entry.tsx'],bundle:true,write:false,minify:true,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const css=fs.readFileSync('app/globals.css','utf8').replace(/@import[^;]+;/g,'');
const escaped=s=>s.replace(/<\/script/gi,'<\\/script');
const html='<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body><div id="root"></div><script>window.__ENGINE_SOURCE__='+escaped(JSON.stringify(source))+';</script><script>'+escaped(result.outputFiles[0].text)+'</script></body></html>';
fs.writeFileSync('lib/generated/widget-html.ts','export const widgetHtml='+JSON.stringify(html)+';\n');
console.log('Widget autocontenido y motor preparados: '+html.length+' bytes');
