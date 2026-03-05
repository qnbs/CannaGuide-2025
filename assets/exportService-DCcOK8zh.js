import{E as V}from"./pdf-export-_jsVKeM0.js";import T from"./image-export-DXEQVQnt.js";class S{generateTxt(p,c){const t=new Blob([p],{type:"text/plain;charset=utf-8"}),e=URL.createObjectURL(t);this.triggerDownload(e,c)}triggerDownload(p,c){const t=document.createElement("a");t.href=p,t.download=c,document.body.appendChild(t),t.click(),setTimeout(()=>{document.body.removeChild(t),URL.revokeObjectURL(p)},100)}exportStrainsAsPdf(p,c,t){const e=new V,o=15,r=15,i=20,d=210-o-r,f=50;p.forEach((n,l)=>{l>0&&e.addPage();let m=i;e.setFontSize(9),e.setTextColor(150),e.text("CannaGuide 2025",o,i-10),e.text(t("strainsView.exportModal.title"),210-r,i-10,{align:"right"}),e.setDrawColor(50),e.line(o,i-7,210-r,i-7),e.setTextColor(0),e.setFontSize(24),e.setFont("helvetica","bold"),e.setTextColor(40,50,70),e.text(n.name,o,m),m+=12;const s=($,h,x=!0,D=!1)=>{h&&(e.setFontSize(11),e.setFont("helvetica",x?"bold":"normal"),e.setTextColor(50),e.text($+":",o,m),e.setFont("helvetica",D?"bold":"normal"),e.setTextColor(20),e.text(h,o+f,m),m+=7)},u=$=>{m+=8,e.setFontSize(14),e.setFont("helvetica","bold"),e.setTextColor(40,50,70),e.text($,o,m),m+=8},g=($,h)=>{if(!h)return;u($),e.setFontSize(11),e.setFont("helvetica","normal"),e.setTextColor(20);const x=e.splitTextToSize(h,d);e.text(x,o,m),m+=x.length*5+5};s(t("common.type"),t(`strainsData.${n.id}.typeDetails`,{defaultValue:n.typeDetails||n.type})),s(t("common.genetics"),t(`strainsData.${n.id}.genetics`,{defaultValue:n.genetics||"N/A"})),u(t("strainsView.strainDetail.cannabinoidProfile")),s(t("strainsView.table.thc"),n.thcRange||`${n.thc}%`),s(t("strainsView.table.cbd"),n.cbdRange||`${n.cbd}%`),u(t("strainsView.strainModal.agronomicData")),s(t("strainsView.table.difficulty"),t(`strainsView.difficulty.${n.agronomic.difficulty.toLowerCase()}`)),s(t("strainsView.table.flowering"),n.floweringTimeRange?`${n.floweringTimeRange} ${t("common.units.weeks")}`:`${n.floweringTime} ${t("common.units.weeks")}`),s(t("strainsView.strainModal.yieldIndoor"),t(`strainsData.${n.id}.yieldDetails.indoor`,{defaultValue:n.agronomic.yieldDetails?.indoor})),s(t("strainsView.strainModal.yieldOutdoor"),t(`strainsData.${n.id}.yieldDetails.outdoor`,{defaultValue:n.agronomic.yieldDetails?.outdoor})),s(t("strainsView.strainModal.heightIndoor"),t(`strainsData.${n.id}.heightDetails.indoor`,{defaultValue:n.agronomic.heightDetails?.indoor})),s(t("strainsView.strainModal.heightOutdoor"),t(`strainsData.${n.id}.heightDetails.outdoor`,{defaultValue:n.agronomic.heightDetails?.outdoor})),u(t("strainsView.strainDetail.aromaProfile")),s(t("strainsView.strainModal.aromas"),(n.aromas||[]).map($=>t(`common.aromas.${$}`,{defaultValue:$})).join(", ")),s(t("strainsView.strainModal.dominantTerpenes"),(n.dominantTerpenes||[]).map($=>t(`common.terpenes.${$}`,{defaultValue:$})).join(", "));const w=t(`strainsData.${n.id}.description`,{defaultValue:n.description});g(t("common.description"),w)});const a=e.internal.getNumberOfPages();for(let n=1;n<=a;n++)e.setPage(n),e.setFontSize(8),e.setTextColor(150),e.text(`${t("common.generated")}: ${new Date().toLocaleString()}`,o,287),e.text(`${t("common.page")} ${n} / ${a}`,210-r,287,{align:"right"});e.save(`${c}.pdf`)}exportStrainsAsTxt(p,c,t){let e=`CannaGuide 2025 - ${t("strainsView.exportModal.title")}
`;e+=`${t("common.generated")}: ${new Date().toLocaleString()}

`,p.forEach(o=>{e+=`========================================
`,e+=`${o.name.toUpperCase()}
`,e+=`========================================

`,e+=`${t("common.type")}: ${t(`strainsData.${o.id}.typeDetails`,{defaultValue:o.typeDetails||o.type})}
`,e+=`${t("common.genetics")}: ${t(`strainsData.${o.id}.genetics`,{defaultValue:o.genetics||"N/A"})}

`,e+=`--- ${t("strainsView.strainDetail.cannabinoidProfile")} ---
`,e+=`${t("strainsView.table.thc")}: ${o.thcRange||`${o.thc}%`}
`,e+=`${t("strainsView.table.cbd")}: ${o.cbdRange||`${o.cbd}%`}

`,e+=`--- ${t("strainsView.strainModal.agronomicData")} ---
`,e+=`${t("strainsView.table.difficulty")}: ${t(`strainsView.difficulty.${o.agronomic.difficulty.toLowerCase()}`)}
`,e+=`${t("strainsView.table.flowering")}: ${o.floweringTimeRange||o.floweringTime} ${t("common.units.weeks")}
`,e+=`${t("strainsView.strainModal.yieldIndoor")}: ${t(`strainsData.${o.id}.yieldDetails.indoor`,{defaultValue:o.agronomic.yieldDetails?.indoor||"N/A"})}
`,e+=`${t("strainsView.strainModal.yieldOutdoor")}: ${t(`strainsData.${o.id}.yieldDetails.outdoor`,{defaultValue:o.agronomic.yieldDetails?.outdoor||"N/A"})}
`,e+=`${t("strainsView.strainModal.heightIndoor")}: ${t(`strainsData.${o.id}.heightDetails.indoor`,{defaultValue:o.agronomic.heightDetails?.indoor||"N/A"})}
`,e+=`${t("strainsView.strainModal.heightOutdoor")}: ${t(`strainsData.${o.id}.heightDetails.outdoor`,{defaultValue:o.agronomic.heightDetails?.outdoor||"N/A"})}

`,e+=`--- ${t("strainsView.strainDetail.aromaProfile")} ---
`,e+=`${t("strainsView.strainModal.aromas")}: ${(o.aromas||[]).map(r=>t(`common.aromas.${r}`,{defaultValue:r})).join(", ")}
`,e+=`${t("strainsView.strainModal.dominantTerpenes")}: ${(o.dominantTerpenes||[]).map(r=>t(`common.terpenes.${r}`,{defaultValue:r})).join(", ")}

`,e+=`--- ${t("common.description")} ---
`,e+=`${t(`strainsData.${o.id}.description`,{defaultValue:o.description||"N/A"})}


`}),this.generateTxt(e,`${c}.txt`)}exportStrainTips(p,c,t,e){if(c==="pdf"){const o=new V;o.text(`${e("strainsView.tips.title")}`,14,15);let r=25;p.forEach(i=>{r>270&&(o.addPage(),r=20),o.setFont("helvetica","bold"),o.text(i.title,14,r),r+=7,o.setFont("helvetica","normal");const d=`${e("strainsView.tips.form.categories.nutrientTip")}: ${i.nutrientTip}
${e("strainsView.tips.form.categories.trainingTip")}: ${i.trainingTip}
${e("strainsView.tips.form.categories.environmentalTip")}: ${i.environmentalTip}
${e("strainsView.tips.form.categories.proTip")}: ${i.proTip}`,f=o.splitTextToSize(d,180);o.text(f,14,r),r+=f.length*5+10}),o.save(`${t}.pdf`)}else{let o=`${e("strainsView.tips.title")}
========================

`;p.forEach(r=>{o+=`${r.title}
------------------------
`,o+=`${e("strainsView.tips.form.categories.nutrientTip")}: ${r.nutrientTip}
`,o+=`${e("strainsView.tips.form.categories.trainingTip")}: ${r.trainingTip}
`,o+=`${e("strainsView.tips.form.categories.environmentalTip")}: ${r.environmentalTip}
`,o+=`${e("strainsView.tips.form.categories.proTip")}: ${r.proTip}

`}),this.generateTxt(o,`${t}.txt`)}}exportSetupsAsPdf(p,c,t){const e=new V,o=15,r=15,i=20,d=210-o-r;p.forEach((a,n)=>{n>0&&e.addPage();let l=i;if(e.setFontSize(9),e.setTextColor(150),e.text("CannaGuide 2025",o,i-10),e.text(t("equipmentView.savedSetups.pdfReport.title"),210-r,i-10,{align:"right"}),e.setDrawColor(50),e.line(o,i-7,210-r,i-7),e.setFontSize(20),e.setFont("helvetica","bold"),e.setTextColor(40,50,70),e.text(a.name,o,l),l+=8,e.setFontSize(9),e.setTextColor(150),e.text(`${t("common.generated")}: ${new Date(a.createdAt).toLocaleString()}`,o,l),l+=10,a.sourceDetails){e.setFontSize(14),e.setFont("helvetica","bold"),e.setTextColor(40,50,70),e.text(t("equipmentView.savedSetups.pdfReport.sourceDetails"),o,l),l+=7;const m=[[t("equipmentView.savedSetups.pdfReport.plantCount"),a.sourceDetails.plantCount],[t("equipmentView.savedSetups.pdfReport.experience"),t(`strainsView.tips.form.experienceOptions.${a.sourceDetails.experience}`)],[t("equipmentView.savedSetups.pdfReport.budget"),`${a.sourceDetails.budget} ${t("common.units.currency_eur")}`],[t("equipmentView.savedSetups.pdfReport.priorities"),a.sourceDetails.priorities.map(s=>t(`equipmentView.configurator.priorities.${s}`)).join(", ")||t("common.none")],[t("equipmentView.savedSetups.pdfReport.customNotes"),a.sourceDetails.customNotes||t("common.none")]];e.autoTable({startY:l,body:m,theme:"plain",styles:{fontSize:10,cellPadding:1.5,halign:"left"},columnStyles:{0:{fontStyle:"bold",textColor:50,cellWidth:40},1:{textColor:20}},didDrawPage:s=>{l=s.cursor.y}}),l=e.lastAutoTable.finalY+10}if(a.recommendation){const m=[],s=["tent","light","ventilation","circulationFan","pots","soil","nutrients","extra"];for(const u of s){const g=a.recommendation[u];typeof g=="object"&&g.name&&m.push([t(`equipmentView.configurator.categories.${u}`),g.name,`${g.price.toFixed(2)} ${t("common.units.currency_eur")}`,g.rationale])}if(e.autoTable({startY:l,head:[[t("common.type"),t("equipmentView.savedSetups.pdfReport.product"),t("equipmentView.savedSetups.pdfReport.price"),t("equipmentView.savedSetups.pdfReport.rationale")]],body:m,theme:"striped",headStyles:{fillColor:[40,50,70]},didDrawPage:u=>{l=u.cursor.y}}),l=e.lastAutoTable.finalY+10,a.recommendation.proTip){l>250&&(e.addPage(),l=i),e.setFontSize(12),e.setFont("helvetica","bold"),e.text(t("strainsView.tips.form.categories.proTip"),o,l),l+=6,e.setFontSize(10),e.setFont("helvetica","normal");const u=e.splitTextToSize(a.recommendation.proTip,d);e.text(u,o,l),l+=u.length*5+5}}e.setFontSize(12),e.setFont("helvetica","bold"),e.text(`${t("equipmentView.savedSetups.pdfReport.totalCost")}: ${a.totalCost.toFixed(2)} ${t("common.units.currency_eur")}`,210-r,l,{align:"right"})});const f=e.internal.getNumberOfPages();for(let a=1;a<=f;a++)e.setPage(a),e.setFontSize(8),e.setTextColor(150),e.text(`${t("common.page")} ${a} / ${f}`,210-r,287,{align:"right"});e.save(`${c}.pdf`)}exportSetupsAsTxt(p,c,t){let e=`CannaGuide 2025 - ${t("equipmentView.savedSetups.pdfReport.title")}
`;e+=`${t("common.generated")}: ${new Date().toLocaleString()}

`,p.forEach(o=>{e+=`==============================
`,e+=`${o.name.toUpperCase()}
`,e+=`==============================
`,e+=`(${t("common.generated")}: ${new Date(o.createdAt).toLocaleString()})

`,o.sourceDetails&&(e+=`--- ${t("equipmentView.savedSetups.pdfReport.sourceDetails")} ---
`,e+=`${t("equipmentView.savedSetups.pdfReport.plantCount")}: ${o.sourceDetails.plantCount}
`,e+=`${t("equipmentView.savedSetups.pdfReport.experience")}: ${t(`strainsView.tips.form.experienceOptions.${o.sourceDetails.experience}`)}
`,e+=`${t("equipmentView.savedSetups.pdfReport.budget")}: ${o.sourceDetails.budget} ${t("common.units.currency_eur")}
`,e+=`${t("equipmentView.savedSetups.pdfReport.priorities")}: ${o.sourceDetails.priorities.map(r=>t(`equipmentView.configurator.priorities.${r}`)).join(", ")||t("common.none")}
`,e+=`${t("equipmentView.savedSetups.pdfReport.customNotes")}: ${o.sourceDetails.customNotes||t("common.none")}

`),o.recommendation&&(e+=`--- EQUIPMENT ---
`,["tent","light","ventilation","circulationFan","pots","soil","nutrients","extra"].forEach(i=>{const d=o.recommendation[i];typeof d=="object"&&d.name&&(e+=`${t(`equipmentView.configurator.categories.${i}`)}: ${d.name} (${d.price.toFixed(2)} ${t("common.units.currency_eur")})
`,e+=`  - Rationale: ${d.rationale}
`)}),e+=`
--- ${t("strainsView.tips.form.categories.proTip")} ---
`,e+=`${o.recommendation.proTip}

`),e+=`TOTAL: ${o.totalCost.toFixed(2)} ${t("common.units.currency_eur")}


`}),this.generateTxt(e,`${c}.txt`)}async exportPlantReportPdf(p){const{plant:c,t,chartElement:e,photos:o=[],fileName:r}=p,i=new V,d=15,f=15;let a=20;i.setFontSize(18),i.setFont("helvetica","bold"),i.text(`Grow Report - ${c.name}`,d,a),a+=8,i.setFontSize(10),i.setFont("helvetica","normal"),i.text(`${t("common.generated")}: ${new Date().toLocaleString()}`,d,a),a+=6,i.text(`${t("common.type")}: ${c.strain.name}`,d,a),a+=6,i.text(`Stage: ${c.stage} | Day: ${c.age}`,d,a),a+=6,i.text(`VPD: ${c.environment.vpd.toFixed(2)} kPa | Temp: ${c.environment.internalTemperature.toFixed(1)} C | RH: ${c.environment.internalHumidity.toFixed(1)}%`,d,a),a+=8;const n=[...c.journal].reverse().slice(0,30).map(s=>[new Date(s.createdAt).toLocaleDateString(),s.type,s.notes]);if(i.autoTable({startY:a,head:[["Date","Type","Notes"]],body:n,theme:"striped",headStyles:{fillColor:[40,50,70]},styles:{fontSize:9,overflow:"linebreak"},margin:{left:d,right:f}}),a=i.lastAutoTable.finalY+8,e){a>230&&(i.addPage(),a=20);const u=(await T(e,{backgroundColor:"#0f172a",scale:2,useCORS:!0})).toDataURL("image/png");i.setFont("helvetica","bold"),i.setFontSize(12),i.text("VPD / Growth Graph",d,a),a+=4;const g=180,w=95;i.addImage(u,"PNG",d,a,g,w),a+=w+8}const l=Math.min(o.length,6);if(l>0){i.addPage(),a=20,i.setFont("helvetica","bold"),i.setFontSize(14),i.text("Grow Photos",d,a),a+=8;const s=85,u=60;for(let g=0;g<l;g++){const w=g%2,$=Math.floor(g/2),h=d+w*(s+6),x=a+$*(u+6),D=o[g].startsWith("data:image/png")?"PNG":"JPEG";i.addImage(o[g],D,h,x,s,u)}}const m=i.internal.getNumberOfPages();for(let s=1;s<=m;s++)i.setPage(s),i.setFontSize(8),i.setTextColor(150),i.text(`${t("common.page")} ${s} / ${m}`,210-f,287,{align:"right"});i.save(`${r||`${c.name.replace(/\s+/g,"-")}-grow-report`}.pdf`)}}const C=new S;export{C as exportService};
