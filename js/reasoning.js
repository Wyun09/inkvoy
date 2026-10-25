// Capability data comes from the selected model's catalog or explicit user setup.
// Model IDs are never used to invent reasoning support.
const effortId=value=>typeof value==='string'&&/^[a-z][a-z0-9_-]{0,39}$/i.test(value)?value:null;
export function normalizeEfforts(values){const seen=new Set();return (Array.isArray(values)?values:[]).slice(0,20).flatMap(item=>{const id=effortId(typeof item==='string'?item:item?.effort??item?.value??item?.id);if(!id||seen.has(id))return [];seen.add(id);return [{id,label:typeof item==='object'?String(item.description||item.label||id).slice(0,160):id}];});}
export function normalizeModel(model){
 const id=String(model?.slug||model?.id||'').slice(0,160);if(!id)return null;
 const raw=model.supported_reasoning_levels??model.supported_reasoning_efforts??model.reasoning_efforts??model.capabilities?.reasoning_efforts??model.reasoning?.levels;
 const levels=normalizeEfforts(raw??model.levels),defaultEffort=effortId(model.default_reasoning_level??model.default_reasoning_effort??model.reasoning?.default??model.defaultEffort);
 const context=Number(model.context_window??model.context_length??model.contextWindow);
 return {id,name:String(model.display_name||model.name||id).slice(0,160),levels,source:levels.length?'catalog':'unknown',...(defaultEffort&&levels.some(l=>l.id===defaultEffort)?{defaultEffort}:{}),...(Number.isInteger(context)&&context>=8192&&context<=2000000?{contextWindow:context}:{})};
}
export function normalizeCatalog(value){return (Array.isArray(value)?value:[]).slice(0,300).map(normalizeModel).filter(Boolean);}
export function modelCapabilities(profile){
 const manual=profile?.reasoningConfig;
 if(manual&&manual.model===profile?.model&&manual.source==='manual'){const levels=normalizeEfforts(manual.levels);if(levels.length)return {id:profile.model,levels,source:'manual'};}
 return normalizeCatalog(profile?.modelCapabilities).find(m=>m.id===profile.model)||{id:profile?.model,levels:[],source:'unknown'};
}
export const reasoningKey=profile=>profile?profile.id+':'+profile.model:'web';
export function selectedEffort(profile,settings){const value=settings?.reasoningByModel?.[reasoningKey(profile)];return modelCapabilities(profile).levels.some(l=>l.id===value)?value:'';}
export function requestEffort(profile,value){return typeof value==='string'&&modelCapabilities(profile).levels.some(l=>l.id===value)?value:undefined;}
export function reasoningFields(connection,settings){if(!connection?.provider&&connection?.source!=='api'&&connection?.source!=='openai_account')return {reasoning_effort:settings?.thinking?'high':'off'};const value=selectedEffort(connection.provider,settings);return value?{reasoning_effort:value}:{};}
