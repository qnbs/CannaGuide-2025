import{GoogleGenAI as G,Type as i,Modality as I}from"./ai-CswQpVRZ.js";import{bf as m}from"./index-C7DuQ5lD.js";import{a as k}from"./apiKeyService-C_ue7MUJ.js";import"./react-B2fiRjvb.js";import"./redux-DNXQ1aqK.js";import"./pdf-export-_jsVKeM0.js";import"./i18n-BOi4-e0F.js";import"./radix-ui-B076TuMA.js";const x=n=>n.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(e=>e.length>2),O=(n,e)=>{const r=n.text.toLowerCase();let t=0;for(const s of e)r.includes(s)&&(t+=2);const a=Math.max(0,1-(Date.now()-n.createdAt)/(1e3*60*60*24*30));return t+a};class P{buildChunks(e){return e.flatMap(r=>r.journal.map(t=>({plantId:r.id,plantName:r.name,createdAt:t.createdAt,text:`${t.type} ${t.notes} ${t.details&&JSON.stringify(t.details)||""}`})))}retrieveRelevantContext(e,r,t=6){const a=this.buildChunks(e);if(a.length===0)return"No grow log entries found.";const s=x(r);return a.map(c=>({chunk:c,score:O(c,s)})).sort((c,l)=>l.score-c.score).slice(0,t).map(({chunk:c})=>`- ${c.plantName} @ ${new Date(c.createdAt).toLocaleString()}: ${c.text.slice(0,240)}`).join(`
`)}}const A=new P,w=n=>n==="de",$=n=>`${n.name}: health ${n.health.toFixed(0)}%, stress ${n.stressLevel.toFixed(0)}%, VPD ${n.environment.vpd.toFixed(2)} kPa`;class C{getMentorResponse(e,r,t,a){return w(a)?{title:`Lokaler Mentor-Fallback: ${e.name}`,content:`<p><strong>Hinweis:</strong> Gemini ist aktuell nicht verfugbar. Antwort basiert auf lokalem Heuristik-Modell.</p><p><strong>Frage:</strong> ${r}</p><p><strong>Pflanze:</strong> ${$(e)}</p><p><strong>Relevante Grow-Logs:</strong><br/>${t.replace(/\n/g,"<br/>")}</p><p><strong>Empfehlung:</strong> Stabilisiere VPD, arbeite in kleinen Schritten und dokumentiere jede Anderung im Journal.</p>`}:{title:`Local Mentor Fallback: ${e.name}`,content:`<p><strong>Note:</strong> Gemini is unavailable. This answer uses a local heuristic fallback.</p><p><strong>Question:</strong> ${r}</p><p><strong>Plant:</strong> ${$(e)}</p><p><strong>Relevant grow logs:</strong><br/>${t.replace(/\n/g,"<br/>")}</p><p><strong>Recommendation:</strong> Stabilize VPD first, then apply one controlled change at a time and log outcomes.</p>`}}getPlantAdvice(e,r){return w(r)?{title:`Lokale Beratung: ${e.name}`,content:`Prioritat 1: VPD und Feuchte stabilisieren. Prioritat 2: pH/EC im Zielbereich halten. Prioritat 3: Stressquellen reduzieren. Aktuell: ${$(e)}.`}:{title:`Local Advice: ${e.name}`,content:`Priority 1: stabilize VPD and humidity. Priority 2: keep pH/EC in range. Priority 3: reduce stressors. Current state: ${$(e)}.`}}getGardenStatusSummary(e,r){const t=e.map($).join(" | ");return w(r)?{title:"Lokaler Gartenstatus",content:`Gemini nicht verfugbar. Lokale Zusammenfassung: ${t||"Keine aktiven Pflanzen."}`}:{title:"Local Garden Status",content:`Gemini unavailable. Local summary: ${t||"No active plants."}`}}getStrainTips(e,r){return w(r)?{nutrientTip:`Nahrstoffe fur ${e.name} langsam steigern und EC engmaschig messen.`,trainingTip:"Fruh mit sanftem LST beginnen, vor starken Eingriffen 48h Erholung einplanen.",environmentalTip:"Tag/Nacht-Differenz klein halten, VPD zielgerichtet fur die Phase steuern.",proTip:"Jede Anpassung einzeln testen und im Journal mit Datum dokumentieren."}:{nutrientTip:`Increase nutrients gradually for ${e.name} and monitor EC closely.`,trainingTip:"Start with gentle LST early and allow 48h recovery after heavy interventions.",environmentalTip:"Keep day/night swings moderate and target VPD by stage.",proTip:"Test one change at a time and document outcomes in the journal."}}getGrowLogRagAnswer(e,r,t){return w(t)?{title:"RAG-Analyse (lokaler Fallback)",content:`Frage: ${e}

Relevante Eintrage:
${r}

Kurzfazit: Wiederkehrende Muster zuerst beheben (Bewasserung, VPD, Lichtabstand) und Wirkung 24-48h verfolgen.`}:{title:"RAG Analysis (local fallback)",content:`Question: ${e}

Relevant entries:
${r}

Summary: resolve recurring patterns first (watering, VPD, light distance) and track outcomes for 24-48h.`}}}const T=new C,E=(n,e)=>{const r=e(`plantStages.${n.stage}`),t=n.problems.length>0?n.problems.map(a=>{const s=a.type.toLowerCase().replace(/_(\w)/g,(o,c)=>c.toUpperCase());return e(`problemMessages.${s}.message`)}).join(", "):e("common.none");return`
PLANT CONTEXT REPORT
====================
Name: ${n.name} (${n.strain.name})
Age: ${n.age} days
Stage: ${r}
Health: ${n.health.toFixed(1)}%
Stress Level: ${n.stressLevel.toFixed(1)}%

ENVIRONMENT
-----------
Temperature: ${n.environment.internalTemperature.toFixed(1)}°C
Humidity: ${n.environment.internalHumidity.toFixed(1)}%
VPD: ${n.environment.vpd.toFixed(2)} kPa
CO2 Level: ${n.environment.co2Level.toFixed(0)} ppm

MEDIUM & ROOTS
-----------------
pH: ${n.medium.ph.toFixed(2)}
EC: ${n.medium.ec.toFixed(2)}
Moisture: ${n.medium.moisture.toFixed(1)}%
Root Health: ${n.rootSystem.health.toFixed(1)}%

ACTIVE ISSUES
-------------
${t}
    `.trim()},h=(n,e)=>`${e==="de"?"WICHTIG: Deine gesamte Antwort muss ausschließlich auf Deutsch (de-DE) sein.":"IMPORTANT: Your entire response must be exclusively in English (en-US)."}

${n}`,L=12e3,F=900,v=1400,R=(n,e=L)=>{if(n.length<=e)return n;const r=n.slice(0,Math.floor(e*.7)),t=n.slice(-Math.floor(e*.3));return`${r}

[...context truncated to fit token window...]

${t}`},b=(n,e=10)=>{if(!n||n.length===0)return"No journal entries available.";const r=n.reduce((s,o)=>(s[o.type]=(s[o.type]||0)+1,s),{}),t=Object.entries(r).map(([s,o])=>`${s}: ${o}`).join(", "),a=n.slice(-e).map(s=>`- day=${new Date(s.createdAt).toISOString()} type=${s.type} notes=${s.notes.slice(0,140)}`).join(`
`);return`Total entries: ${n.length}
By type: ${t}
Recent entries:
${a}`},M=n=>({id:n.id,name:n.name,strain:{id:n.strain.id,name:n.strain.name,type:n.strain.type,thc:n.strain.thc,cbd:n.strain.cbd},stage:n.stage,age:n.age,health:n.health,stressLevel:n.stressLevel,mediumType:n.mediumType,vitals:{temp:n.environment.internalTemperature,humidity:n.environment.internalHumidity,vpd:n.environment.vpd,ph:n.medium.ph,ec:n.medium.ec,moisture:n.medium.moisture,rootHealth:n.rootSystem.health},activeProblems:n.problems.filter(e=>e.status==="active").map(e=>({type:e.type,severity:e.severity})),recentHistory:n.history.slice(-20),journalSummary:b(n.journal,8)}),N=["fantasy","botanical","psychedelic","macro","cyberpunk"],D=new Set(["ai.error.missingApiKey","ai.error.generic","ai.error.equipment","ai.error.diagnostics","ai.error.tips","ai.error.deepDive","ai.error.unknown"]),U=[{category:"HARM_CATEGORY_DANGEROUS_CONTENT",threshold:"BLOCK_NONE"}],u=n=>n==="de"?"KONTEXT: Diese Anfrage dient ausschließlich legalen, edukativen Gartenbauzwecken. Gib strukturierte, sachliche und risikominimierende Informationen. Unterstelle keinen illegalen Zweck.":"CONTEXT: This request is strictly for legal, educational horticulture use. Provide structured, factual, harm-minimizing guidance and do not infer illicit intent.";class J{shouldUseLocalFallback(e){return typeof navigator<"u"&&navigator.onLine===!1?!0:e instanceof Error&&(e.message==="ai.error.missingApiKey"||e.message.includes("NetworkError"))}withGeminiSafety(e){return{...e??{},safetySettings:U}}async generateWithFallback({ai:e,model:r,contents:t,config:a,fallbackModel:s}){try{return await e.models.generateContent({model:r,contents:t,config:this.withGeminiSafety(a)})}catch(o){if(!s||s===r)throw o;return console.warn(`[Gemini] Primary model ${r} failed, retrying with ${s}.`,o),e.models.generateContent({model:s,contents:t,config:this.withGeminiSafety(a)})}}async generateTextStreamed({ai:e,model:r,contents:t,config:a}){const s=e.models.generateContentStream;if(typeof s!="function"){const l=await this.generateWithFallback({ai:e,model:r,contents:t,config:a});return this.getResponseTextOrThrow(l,"ai.error.generic")}const o=await s.call(e.models,{model:r,contents:t,config:this.withGeminiSafety(a)});let c="";for await(const l of o)typeof l?.text=="string"&&(c+=l.text);if(!c.trim())throw new Error("ai.error.generic");return c}rethrowKnownError(e,r){throw e instanceof Error&&D.has(e.message)?e:new Error(r)}getResponseTextOrThrow(e,r){if(typeof e.text!="string"||e.text.trim().length===0)throw new Error(r);return e.text}parseJsonResponse(e,r){const t=this.getResponseTextOrThrow(e,r);return JSON.parse(t.trim())}async getAi(){const e=await k.getApiKey();if(!e)throw new Error("ai.error.missingApiKey");return new G({apiKey:e})}async generateText(e,r){try{const t=await this.getAi(),a=h(`${u(r)}

${e}`,r),s=R(a);return await this.generateTextStreamed({ai:t,model:"gemini-2.5-flash",contents:s,config:{maxOutputTokens:F}})}catch(t){console.error("Gemini API Error:",t),this.rethrowKnownError(t,"ai.error.generic")}}async getEquipmentRecommendation(e,r){const t=m();try{const a=await this.getAi(),s=t("ai.prompts.equipmentSystemInstruction"),o=h(`${u(r)}

${s}`,r),c=await this.generateWithFallback({ai:a,model:"gemini-2.5-flash",contents:R(`${u(r)}

${e}`),config:{systemInstruction:o,maxOutputTokens:v,responseMimeType:"application/json",responseSchema:{type:i.OBJECT,properties:{tent:{type:i.OBJECT,properties:{name:{type:i.STRING},price:{type:i.NUMBER},rationale:{type:i.STRING}},required:["name","price","rationale"]},light:{type:i.OBJECT,properties:{name:{type:i.STRING},price:{type:i.NUMBER},rationale:{type:i.STRING},watts:{type:i.NUMBER}},required:["name","price","rationale","watts"]},ventilation:{type:i.OBJECT,properties:{name:{type:i.STRING},price:{type:i.NUMBER},rationale:{type:i.STRING}},required:["name","price","rationale"]},circulationFan:{type:i.OBJECT,properties:{name:{type:i.STRING},price:{type:i.NUMBER},rationale:{type:i.STRING}},required:["name","price","rationale"]},pots:{type:i.OBJECT,properties:{name:{type:i.STRING},price:{type:i.NUMBER},rationale:{type:i.STRING}},required:["name","price","rationale"]},soil:{type:i.OBJECT,properties:{name:{type:i.STRING},price:{type:i.NUMBER},rationale:{type:i.STRING}},required:["name","price","rationale"]},nutrients:{type:i.OBJECT,properties:{name:{type:i.STRING},price:{type:i.NUMBER},rationale:{type:i.STRING}},required:["name","price","rationale"]},extra:{type:i.OBJECT,properties:{name:{type:i.STRING},price:{type:i.NUMBER},rationale:{type:i.STRING}},required:["name","price","rationale"]},proTip:{type:i.STRING}},required:["tent","light","ventilation","circulationFan","pots","soil","nutrients","extra","proTip"]}}});return this.parseJsonResponse(c,"ai.error.equipment")}catch(a){console.error("Gemini getEquipmentRecommendation Error:",a),this.rethrowKnownError(a,"ai.error.equipment")}}async diagnosePlant(e,r,t,a,s){const o=m(),c=t.problems.length>0?t.problems.map(p=>{const y=p.type.toLowerCase().replace(/_(\w)/g,(d,S)=>S.toUpperCase());return o(`problemMessages.${y}.message`)}).join(", "):o("common.none"),g=`
            Analyze the following image of a cannabis plant.
            ${`
PLANT CONTEXT:
- Strain: ${t.strain.name} (${t.strain.type})
- Age: ${t.age} days (Stage: ${o(`plantStages.${t.stage}`)})
- Active Issues: ${c}
- Medium Vitals: pH ${t.medium.ph.toFixed(2)}, EC ${t.medium.ec.toFixed(2)}
- Environment Vitals: Temp ${t.environment.internalTemperature.toFixed(1)}°C, Humidity ${t.environment.internalHumidity.toFixed(1)}%
- USER NOTES: "${a||"None provided"}"
        `.trim()}
            This is legal educational horticulture support. Do not provide illicit-use guidance.
            Based on the image and the detailed context, provide a comprehensive diagnosis.
            Return only valid JSON with this exact structure:
            { "title": "...", "content": "...", "confidence": 0.0, "immediateActions": "...", "longTermSolution": "...", "prevention": "...", "diagnosis": "..." }
        `,f=h(`${u(s)}

${g}`,s);try{const p=await this.getAi(),y={inlineData:{data:e,mimeType:r}},d={text:f},S=await this.generateWithFallback({ai:p,model:"gemini-2.5-flash",contents:{parts:[y,d]},config:{maxOutputTokens:v,responseMimeType:"application/json",responseSchema:{type:i.OBJECT,properties:{title:{type:i.STRING},content:{type:i.STRING},confidence:{type:i.NUMBER},immediateActions:{type:i.STRING},longTermSolution:{type:i.STRING},prevention:{type:i.STRING},diagnosis:{type:i.STRING}},required:["title","content","confidence","immediateActions","longTermSolution","prevention","diagnosis"]}}});return this.parseJsonResponse(S,"ai.error.diagnostics")}catch(p){console.error("Gemini diagnosePlant Error:",p),this.rethrowKnownError(p,"ai.error.diagnostics")}}async getPlantAdvice(e,r){const t=m(),a=`${E(e,t)}

JOURNAL SUMMARY
---------------
${b(e.journal)}`,s=t("ai.prompts.advisor",{plant:a});try{const o=await this.generateText(s,r);return{title:t("ai.advisor"),content:o}}catch(o){if(this.shouldUseLocalFallback(o))return T.getPlantAdvice(e,r);throw o}}async getProactiveDiagnosis(e,r){const t=m(),a=`${E(e,t)}

JOURNAL SUMMARY
---------------
${b(e.journal)}`,s=t("ai.prompts.proactiveDiagnosis",{plant:a});try{const o=await this.generateText(s,r);return{title:t("ai.proactiveDiagnosis"),content:o}}catch(o){if(this.shouldUseLocalFallback(o))return T.getPlantAdvice(e,r);throw o}}async getMentorResponse(e,r,t){const a=m(),s=`${E(e,a)}

JOURNAL SUMMARY
---------------
${b(e.journal)}`,o=A.retrieveRelevantContext([e],r),c=a("ai.prompts.mentor.main",{context:`${s}

RELEVANT GROW LOG CONTEXT
-------------------------
${o}`,query:r});try{const l=await this.getAi(),g=a("ai.prompts.mentor.systemInstruction"),f=h(`${u(t)}

${g}`,t),p=h(`${u(t)}

${c}`,t),y=await this.generateWithFallback({ai:l,model:"gemini-2.5-flash",contents:R(p),config:{systemInstruction:f,maxOutputTokens:v,responseMimeType:"application/json",responseSchema:{type:i.OBJECT,properties:{title:{type:i.STRING},content:{type:i.STRING},uiHighlights:{type:i.ARRAY,items:{type:i.OBJECT,properties:{elementId:{type:i.STRING},plantId:{type:i.STRING}},required:["elementId"]}}},required:["title","content"]}}});return this.parseJsonResponse(y,"ai.error.generic")}catch(l){if(console.error("Gemini getMentorResponse Error:",l),this.shouldUseLocalFallback(l))return T.getMentorResponse(e,r,o,t);this.rethrowKnownError(l,"ai.error.generic")}}async getStrainTips(e,r,t){const s=m()("ai.prompts.strainTips",{strain:JSON.stringify(e),focus:r.focus,stage:r.stage,experienceLevel:r.experienceLevel}),o=h(`${u(t)}

${s}`,t);try{const c=await this.getAi(),l=await this.generateWithFallback({ai:c,model:"gemini-2.5-flash",contents:R(o),config:{maxOutputTokens:v,responseMimeType:"application/json",responseSchema:{type:i.OBJECT,properties:{nutrientTip:{type:i.STRING},trainingTip:{type:i.STRING},environmentalTip:{type:i.STRING},proTip:{type:i.STRING}},required:["nutrientTip","trainingTip","environmentalTip","proTip"]}}});return this.parseJsonResponse(l,"ai.error.tips")}catch(c){if(console.error("Gemini getStrainTips Error:",c),this.shouldUseLocalFallback(c))return T.getStrainTips(e,t);this.rethrowKnownError(c,"ai.error.tips")}}async generateStrainImage(e,r,t){const a="You are an advanced image generation AI. Your task is to produce a single, high-fidelity, visually stunning, and contextually accurate image based on the user's detailed prompt. Adhere strictly to all instructions, especially regarding style, subject, and mood. Interpret prompts artistically but precisely.";let s=r;s==="random"&&(s=N[Math.floor(Math.random()*N.length)]);const o={fantasy:`A stunning, artistic, and imaginative fantasy illustration representing the cannabis strain '${e.name}'. The style should be vibrant and impressive, with ethereal, magical lighting.`,botanical:`A detailed vintage botanical illustration of the cannabis strain '${e.name}'. The style should mimic a 19th-century scientific drawing with fine ink lines, delicate watercolor washes, and annotations on aged, parchment-like paper. Focus on realism and anatomical accuracy.`,psychedelic:`A vibrant, psychedelic art piece inspired by the cannabis strain '${e.name}'. The style should be reminiscent of 1960s poster art, featuring swirling patterns, kaleidoscopic visuals, bold neon colors, and abstract, flowing shapes. Trippy and mesmerizing.`,macro:`An ultra-realistic, professional macro photograph of a perfect cannabis bud from the strain '${e.name}'. Focus on the intricate details: glistening trichomes, vibrant pistils, and complex textures. Use dramatic studio lighting to create depth. The background should be clean and dark.`,cyberpunk:`A high-tech, cyberpunk-style hologram of the cannabis strain '${e.name}'. The plant should be rendered as a glowing, neon-blue and purple wireframe or semi-translucent light form, projected into a dark, futuristic scene. Incorporate glitch effects and scan lines for a high-tech feel.`},c={focus:{buds:"The main focus is a close-up on the detailed structure of the flower buds.",plant:"The composition features the entire plant, showcasing its overall shape and structure.",abstract:"The image is an abstract representation of the strain's essence, not a literal plant."},composition:{symmetrical:"The composition is balanced and formally symmetrical.",dynamic:"The composition is dynamic, using strong diagonal lines and a sense of movement.",minimalist:"The composition is minimalist, with a single subject against a simple, clean background."},mood:{mystical:"The overall mood is mystical, dark, and enigmatic.",energetic:"The overall mood is bright, energetic, and vibrant.",calm:"The overall mood is calm, serene, and peaceful."}},l=o[s],g=`
            Artistic Direction:
            - Focus: ${c.focus[t.focus]}
            - Composition: ${c.composition[t.composition]}
            - Mood: ${c.mood[t.mood]}
            - Integrate the strain's name '${e.name}' creatively and elegantly into the artwork itself, for example as subtle typography, glowing runes, or part of a natural pattern.
        `,f=`${a}

---

CONTEXT: The image request is for legal, educational horticulture visualization only.

EXECUTE THE FOLLOWING PROMPT:

${l}

${g}`;try{const p=await this.getAi(),d=(await this.generateWithFallback({ai:p,model:"gemini-2.5-flash-image",contents:{parts:[{text:f}]},config:{responseModalities:[I.IMAGE]}})).candidates?.[0]?.content?.parts?.find(S=>S.inlineData);if(d&&d.inlineData&&typeof d.inlineData.data=="string")return d.inlineData.data;throw new Error("No image was generated by the API.")}catch(p){console.error("Gemini generateStrainImage Error:",p),this.rethrowKnownError(p,"ai.error.generic")}}async generateDeepDive(e,r,t){const a=m(),s=M(r),o=a("ai.prompts.deepDive",{topic:e,plant:JSON.stringify(s)}),c=h(`${u(t)}

${o}`,t);try{const l=await this.getAi(),g=await this.generateWithFallback({ai:l,model:"gemini-2.5-pro",fallbackModel:"gemini-2.5-flash",contents:R(c),config:{maxOutputTokens:v,responseMimeType:"application/json",responseSchema:{type:i.OBJECT,properties:{introduction:{type:i.STRING},stepByStep:{type:i.ARRAY,items:{type:i.STRING}},prosAndCons:{type:i.OBJECT,properties:{pros:{type:i.ARRAY,items:{type:i.STRING}},cons:{type:i.ARRAY,items:{type:i.STRING}}},required:["pros","cons"]},proTip:{type:i.STRING}},required:["introduction","stepByStep","prosAndCons","proTip"]}}});return this.parseJsonResponse(g,"ai.error.deepDive")}catch(l){console.error("Gemini generateDeepDive Error:",l),this.rethrowKnownError(l,"ai.error.deepDive")}}async getGardenStatusSummary(e,r){const t=m(),a=e.map(o=>`- ${o.name} (${t("plantsView.plantCard.day")} ${o.age}, ${t(`plantStages.${o.stage}`)}): Health ${o.health.toFixed(0)}%, Stress ${o.stressLevel.toFixed(0)}%. Problems: ${o.problems.length>0?o.problems.map(c=>c.type).join(", "):"None"}`).join(`
`),s=t("ai.prompts.gardenStatus",{summaries:a});try{const o=await this.generateText(s,r);return{title:t("plantsView.gardenVitals.aiStatusTitle"),content:o}}catch(o){if(this.shouldUseLocalFallback(o))return T.getGardenStatusSummary(e,r);throw o}}async getGrowLogRagAnswer(e,r,t){const a=A.retrieveRelevantContext(e,r),s=`Answer the question using only the provided grow-log context.

Question:
${r}

Grow-log context:
${a}

If information is uncertain, explicitly say so.`;try{const o=await this.generateText(s,t);return{title:t==="de"?"RAG Grow-Log Analyse":"RAG Grow Log Analysis",content:o}}catch(o){if(this.shouldUseLocalFallback(o))return T.getGrowLogRagAnswer(r,a,t);throw o}}getDynamicLoadingMessages({useCase:e,data:r}){const a=m()(`ai.loading.${e}`,{...r,returnObjects:!0});return typeof a=="object"&&a!==null&&!Array.isArray(a)?Object.values(a).map(String):Array.isArray(a)?a.map(String):[String(a)]}}const W=new J;export{W as geminiService};
