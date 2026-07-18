import { createClient } from "@supabase/supabase-js";
export type Driver={slug:string;name:string;number:number;category:string;points:number;wins:number;podiums:number};
export const drivers:Driver[]=[
 {slug:"walison-goncalves",name:"Walison Gonçalves",number:7,category:"Ultras Insanos",points:112,wins:3,podiums:5},
 {slug:"haroldo-alves",name:"Haroldo Alves",number:79,category:"Ultras Insanos",points:104,wins:2,podiums:5},
 {slug:"aldo-senna",name:"Aldo Senna",number:44,category:"Ultras Rápidos",points:98,wins:2,podiums:4},
 {slug:"pedro-guilherme",name:"Pedro Guilherme",number:70,category:"Ultras Rápidos",points:91,wins:1,podiums:4},
 {slug:"arthur-henrique",name:"Arthur Henrique",number:56,category:"Ultras Rápidos",points:84,wins:0,podiums:3}
];
export const stages=[
 {date:"18 AGO",title:"Endurance",track:"Traçado 01 invertido com chicane",time:"21h"},
 {date:"08 SET",title:"Etapa regular",track:"Traçado 02 normal e invertido",time:"21h"},
 {date:"13 OUT",title:"Etapa regular",track:"Traçado 05 normal e invertido",time:"21h"},
 {date:"10 NOV",title:"Etapa regular",track:"Traçado 11 normal e invertido",time:"21h"},
 {date:"12 DEZ",title:"Final Endurance",track:"Traçado 01 normal",time:"11h"}
];
export async function publicData(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return {drivers,stages};try{const db=createClient(url,key);const [{data:remoteDrivers},{data:remoteStages}]=await Promise.all([db.from("public_standings").select("slug,name,number,category,points,wins,podiums").order("points",{ascending:false}).limit(20),db.from("public_calendar").select("date_label,title,track,time_label").order("starts_at")]);return {drivers:remoteDrivers?.length?remoteDrivers.map((d:any)=>({slug:d.slug,name:d.name,number:d.number,category:d.category,points:d.points,wins:d.wins,podiums:d.podiums})):drivers,stages:remoteStages?.length?remoteStages.map((s:any)=>({date:s.date_label,title:s.title,track:s.track,time:s.time_label})):stages}}catch{return {drivers,stages}}}