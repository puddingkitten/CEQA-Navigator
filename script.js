// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
const answers={}, multiAnswers={};
let currentSection=0, deterResult=null;
let selectedPlan='basic', feedbackRating=0, feedbackCats=[];
let guardTarget=null, hasUnsavedProgress=false;

const STEPS=[
  {id:1,label:'Applicant'},{id:2,label:'Type'},{id:3,label:'Size'},
  {id:4,label:'Site'},{id:5,label:'Approvals'},{id:6,label:'Features'},
  {id:'6b',label:'Ownership'},{id:7,label:'Prior CEQA'},{id:8,label:'Risk'},{id:9,label:'Results'}
];

// ═══════════════════════════════════════════════════════════
// NAVIGATION & PROGRESS
// ═══════════════════════════════════════════════════════════
function renderProgress(){
  const wrap=document.getElementById('progressSteps');
  wrap.innerHTML='';
  STEPS.forEach((step,i)=>{
    const item=document.createElement('div');
    item.className='step-item';
    if(currentSection===step.id)item.classList.add('active');
    else if(currentSection>step.id)item.classList.add('done');
    const circ=document.createElement('div');
    circ.className='step-circle';
    circ.textContent=currentSection>step.id?'✓':step.id;
    item.appendChild(circ);
    const lbl=document.createElement('div');
    lbl.className='step-label';
    lbl.textContent=step.label;
    item.appendChild(lbl);
    if(i<STEPS.length-1){const line=document.createElement('div');line.className='step-line';item.appendChild(line);}
    wrap.appendChild(item);
  });
  document.getElementById('progressWrap').style.display=currentSection===0?'none':'block';
}

function goToSection(n){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById('section-'+n).classList.add('active');
  currentSection=n;
  renderProgress();
  window.scrollTo({top:0,behavior:'smooth'});
  if(n>0&&n<9) hasUnsavedProgress=true;
  if(n===9) hasUnsavedProgress=false;
  // Show/hide official bar on home only
  const ob=document.getElementById('official-bar');
  if(ob) ob.style.display=(n===0)?'flex':'none';
}

// Logo + Home button — guard if mid-assessment
function logoHome(e){
  if(e)e.preventDefault();
  if(hasUnsavedProgress && currentSection>0 && currentSection<9){
    guardTarget='home';
    document.getElementById('guard-step-label').textContent=`${currentSection} of 8`;
    document.getElementById('guard-modal').style.display='flex';
    return;
  }
  doGoHome();
}
function doGoHome(){
  hasUnsavedProgress=false;
  goToSection(0);
}

// ── GUARD MODAL ──
function guardStay(){document.getElementById('guard-modal').style.display='none';}
function closeGuard(){document.getElementById('guard-modal').style.display='none';}
function guardProceed(){
  document.getElementById('guard-modal').style.display='none';
  if(guardTarget==='home') doGoHome();
}

// ─── SINGLE SELECT ──
function selectChoice(qId,value,btn){
  answers[qId]=value;
  btn.closest('.choices').querySelectorAll('.choice-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  const next=document.getElementById(qId+'-next');
  if(next) next.disabled=false;
  hasUnsavedProgress=true;
  // Show acquisition note for q6b
  if(qId==='q6b'){
    const note=document.getElementById('acquisition-note');
    const info=ACQ_NOTES[value];
    if(note&&info){
      note.style.display='block';
      note.style.background=info.color;
      note.style.border=`1px solid ${info.border}`;
      note.innerHTML=info.text;
    }
  }
}

// ─── MULTI SELECT ──
function toggleCheck(btn){
  const group=btn.dataset.group,val=btn.dataset.value,excl=btn.dataset.exclusive==='true';
  if(!multiAnswers[group])multiAnswers[group]=new Set();
  const set=multiAnswers[group];
  if(excl){
    if(btn.classList.contains('selected')){btn.classList.remove('selected');set.delete(val);}
    else{document.querySelectorAll(`[data-group="${group}"]`).forEach(b=>b.classList.remove('selected'));set.clear();btn.classList.add('selected');set.add(val);}
  } else {
    const nb=document.querySelector(`[data-group="${group}"][data-exclusive="true"]`);
    if(nb){nb.classList.remove('selected');set.delete('none');}
    if(btn.classList.contains('selected')){btn.classList.remove('selected');set.delete(val);}
    else{btn.classList.add('selected');set.add(val);}
  }
  const next=document.getElementById(group+'-next');
  if(next) next.disabled=(set.size===0);
  hasUnsavedProgress=true;
  // Show/hide Cortese panel when hazmat is toggled
  if(group==='q5'){
    const cp=document.getElementById('cortese-panel');
    if(cp) cp.style.display=set.has('hazmat')?'flex':'none';
  }
}

function openCortese(e){
  e.preventDefault();
  window.open('https://www.dtsc.ca.gov/SiteCleanup/Cortese_List.cfm','_blank','noopener');
}

// Acquisition note messages
const ACQ_NOTES={
  public_owned:{color:'var(--green-light)',border:'#a8d5be',text:'<strong style="color:var(--green)">No acquisition impact.</strong> All land is publicly owned — no additional acquisition analysis is required. Standard CEQA review applies.'},
  some_acquisition:{color:'var(--amber-light)',border:'#e5c87a',text:'<strong style="color:var(--amber)">Acquisition analysis required.</strong> CEQA must analyze displacement and relocation impacts under §15064(h). If eminent domain is involved, a resolution of necessity is required (Code of Civil Procedure §1245.220). The CEQA document must address consistency with the Surplus Lands Act (Gov. Code §54220+) if publicly owned land is being transferred.'},
  all_acquisition:{color:'var(--red-light)',border:'#e5a090',text:'<strong style="color:var(--red)">Full acquisition program required.</strong> The CEQA document must include a thorough displacement and relocation impact analysis. Federal funding may additionally trigger the Uniform Relocation Assistance and Real Property Acquisition Act (42 U.S.C. §4601). This typically adds scope to both the EIR and the project timeline.'},
  private_fee:{color:'var(--green-light)',border:'#a8d5be',text:'<strong style="color:var(--green)">No public acquisition involved.</strong> Private applicant owns the site. Standard CEQA analysis applies. No acquisition, displacement, or Surplus Lands Act considerations.'},
  unknown:{color:'var(--amber-light)',border:'#e5c87a',text:'<strong style="color:var(--amber)">Treat as partial acquisition for conservatism.</strong> If acquisition needs are later confirmed, additional CEQA analysis will be required. Flag this for your CEQA consultant.'}
};

// ═══════════════════════════════════════════════════════════
// CEQA DATA (2026)
// ═══════════════════════════════════════════════════════════
const CT={
  NO_CEQA:{name:'CEQA Does Not Apply',abbr:'No CEQA',auth:'PRC § 21080(b)',desc:'CEQA does not apply to this project. This is distinct from a statutory or categorical exemption — the project simply does not trigger CEQA review at all. Under PRC §21080(b), CEQA does not apply to: (1) ministerial projects with no agency discretion; (2) emergency repairs to public facilities; (3) projects rejected or disapproved; (4) general plan/zoning studies with no commitment to approve; (5) feasibility/planning studies; (6) continuing administrative activities; (7) inspection/licensing activities; (8) ministerial permits. No Notice of Exemption is legally required, though filing one is still recommended to establish a 35-day statute of limitations.'},
  CAT_EXEMPT:{name:'Categorical Exemption',abbr:'Cat. Ex.',auth:'CEQA Guidelines §§ 15300–15333',desc:'No formal environmental document required. Project falls within a defined class already determined to have no significant effect. Common classes for infrastructure and trail projects: §15301 (Existing Facilities — alterations, maintenance, repair); §15302 (Replacement/Reconstruction); §15304 (Minor Alterations to Land — grading, landscaping, trail construction). Exceptions that block use of a categorical exemption: site listed on a hazmat database (Cortese List, Envirostor, GeoTracker); historic resources present; site on a scenic highway; unusual circumstances; or cumulative impacts. Note: the presence of contaminated soil alone does not block a categorical exemption — only if the site is actively listed on a hazmat database (Gov. Code §65962.5). Technical studies (cultural resources, hazmat screening) are typically required to confirm no exceptions apply.'},
  STATUTORY_EXEMPT:{name:'Statutory Exemption',abbr:'Stat. Ex.',auth:'PRC §§ 21080–21080.70 (2025 amendments)',desc:'The Legislature has specifically exempted certain project types from CEQA. Key exemptions include: §21080.25(b)(1) bike and pedestrian facilities in public right-of-way (trails, bike lanes, sidewalks) — commonly used for trail construction projects; SB 79 (transit-oriented housing); AB 507 (office-to-residential adaptive reuse); AB 130/SB 131 (housing element implementation §21080.085); SB 71 (transit route changes); §21080.49 (wildfire risk reduction). Important limitation: statutory exemptions under §21080.25 cannot be used if any private parcels are included in the project footprint — even a narrow easement acquisition can disqualify this pathway.'},
  ND:{name:'Negative Declaration',abbr:'ND',auth:'CEQA Guidelines § 15070 / PRC § 21064',desc:'Initial Study finds no substantial evidence of significant environmental effect. 20-day public review. Fastest formal CEQA pathway. Statutory limits: 180 days for public agencies (§21151.5). Private applicants: clock runs from complete application date.'},
  MND:{name:'Mitigated Negative Declaration',abbr:'MND',auth:'CEQA Guidelines § 15070(b) / PRC § 21064.5',desc:'The Initial Study finds potentially significant impacts that can be fully mitigated by project revisions. A Mitigation Monitoring and Reporting Program (MMRP) is adopted with approval. Many agencies prepare a <strong>Focused Initial Study</strong> — an IS that analyzes only the environmental topics of concern identified during pre-application review — rather than all 20 Appendix G topics. A Focused IS leads to the same ND/MND/EIR determination but is faster and cheaper. Caution: 2025 Koi Nation ruling requires meaningful, documented AB 52 tribal consultation — perfunctory contact invalidates the MND.'},
  ADDENDUM:{name:'Addendum to Prior EIR/ND',abbr:'Addendum',auth:'CEQA Guidelines § 15164',desc:'Minor changes to a previously certified document. No new significant impacts. No public review or recirculation required. Must document why §15162 Subsequent EIR thresholds are not triggered.'},
  SUBSEQUENT_MND:{name:'Subsequent Mitigated Negative Declaration',abbr:'Subseq. MND',auth:'CEQA Guidelines § 15162 / PRC § 21166',desc:'Used when a prior MND exists but conditions have changed. New information shows impacts are more severe than originally mitigated, but can still be fully mitigated. Less expensive than a full EIR.'},
  SUB_EIR:{name:'Subsequent / Supplemental EIR',abbr:'Subseq. EIR',auth:'CEQA Guidelines §§ 15162–15163',desc:'Required when new information or substantial project changes go beyond a prior EIR. Focused on new or changed impacts only — does not repeat certified analysis.'},
  EIR:{name:'Environmental Impact Report',abbr:'EIR',auth:'CEQA Guidelines §§ 15080–15131 / PRC § 21100',desc:'Most comprehensive CEQA document. Required when substantial evidence supports a fair argument that the project may have a significant effect. All Appendix G topics analyzed. VMT under §15064.3. §21080.43–44: agency must accept feasible VMT mitigation. Statutory limit: 1 year for public agencies (§21100.2); EIR contract must execute within 45 days of NOP.'},
  PROGRAM_EIR:{name:'Program Environmental Impact Report',abbr:'Program EIR',auth:'CEQA Guidelines § 15168 / PRC § 21094',desc:'Broad EIR covering a series of related actions or a geographic planning area. Used for General Plans, Specific Plans, and large infrastructure programs. Future projects can tier off the PEIR with lighter analysis, saving significant time and cost.'},
};

const FLOWS={
  NO_CEQA:[
    {ph:'Verification',st:'Confirm CEQA does not apply',det:'Document which PRC §21080(b) category applies. For ministerial projects: confirm agency has no discretion to impose conditions beyond code requirements. Memo from legal counsel or lead agency environmental staff recommended.',tm:'1–3 days'},
    {ph:'Filing (opt.)',st:'File Notice of Exemption (NOE) — optional but recommended',det:'Filing an NOE with the County Clerk and OPR triggers the 35-day statute of limitations window. Without it, the 180-day SOL applies and the project remains more vulnerable to challenge.',tm:'1 day',fee:'$50 (optional)'},
    {ph:'Approval',st:'Project proceeds under applicable regulatory permits',det:'Building permit, grading permit, or other ministerial approvals issued as normal. No CEQA document, public notice, or environmental review required.',tm:'Per agency processing time'},
  ],
  CAT_EXEMPT:[
    {ph:'Tech Studies',st:'Prepare required technical reports',det:'Even without a formal CEQA document, technical studies are required to confirm no exceptions apply (§15300.2): (1) Cultural resources records search and field survey — confirms no historic resources present; (2) Hazmat database check against Cortese List, Envirostor, and GeoTracker — confirms site is not listed. Note: actual contaminated soil does not block the exemption unless the site is actively database-listed (DJP & Associates, 2026).',tm:'4–6 weeks',fee:'$5,000–$20,000'},
    {ph:'Determination',st:'Confirm categorical exemption class and no exceptions',det:'Verify project fits a defined class: §15301 (Existing Facilities), §15302 (Replacement), or §15304 (Minor Alterations to Land — trail construction). Confirm all §15300.2 exceptions are absent. Document the determination in a written memo signed by the lead agency.',tm:'1–2 weeks'},
    {ph:'Filing',st:'File Notice of Exemption (NOE)',det:'Filed with County Clerk and OPR within 5 days of approval (§21108). Triggers 35-day SOL. Without NOE, SOL extends to 180 days.',tm:'1 day',fee:'$50'},
    {ph:'SOL',st:'35-day challenge window',det:'After NOE posting. A legal challenge must be filed within 35 days.',tm:'35 days'},
    {ph:'Approval',st:'Project approved and permits issued',det:'Agency processes discretionary approval. One public meeting typically required for project approval (not for CEQA).',tm:'4–6 weeks (agency-dependent)'},
  ],
  STATUTORY_EXEMPT:[
    {ph:'Eligibility',st:'Confirm statutory basis and eligibility conditions',det:'For §21080.25(b)(1) bike/ped/trail: project must be entirely within public right-of-way — no private parcels. Verify no federal nexus triggering NEPA. For SB 79 (§65912.155+), AB 507, §21080.085, §21080.49: confirm all statutory conditions. Document the legal basis in writing.',tm:'1–2 weeks'},
    {ph:'Filing',st:'File Notice of Exemption (NOE)',det:'Filed with County Clerk and OPR within 5 days of project approval (§21108). Triggers 35-day SOL. Without NOE the SOL extends to 180 days.',tm:'1 day',fee:'$50'},
    {ph:'SOL',st:'35-day challenge window',det:'After NOE posting. No public review required, but challenge window must run before full expenditure on construction.',tm:'35 days'},
    {ph:'Approval',st:'Project approved',det:'Agency processes the approval. CEQA review not required. No public meeting required solely for CEQA (project approval meeting still needed).',tm:'30–60 days (agency-dependent)'},
  ],
  ND:[
    {ph:'Initial Study',st:'Prepare Initial Study (IS)',det:'Lead agency evaluates all CEQA Appendix G topic areas. Must include AB 52 tribal consultation — tribes have 30 days to respond; consultation concludes within 45 days (15-day extension available).',tm:'4–8 weeks',fee:'$5K–$25K consultant'},
    {ph:'Public Notice',st:'Notice of Intent — 20-day review',det:'Circulated to responsible agencies, tribes, and public. 30-day review if submitted to State Clearinghouse.',tm:'20–30 days',fee:'$200–$500'},
    {ph:'Adoption',st:'Agency adopts Negative Declaration',det:'Considers all comments. Formally adopts the ND with findings that no significant impacts exist.',tm:'2–4 weeks'},
    {ph:'Filing',st:'File Notice of Determination (NOD)',det:'Within 5 days of approval. 30-day SOL begins. Public agencies: file with OPR (§21108). Local agencies: file with County Clerk (§21152).',tm:'5 days',fee:'$50 + CDFW $3,717.25'},
    {ph:'Approval',st:'Project approved and permits issued',tm:'4–8 weeks (agency-dependent)'},
  ],
  MND:[
    {ph:'Initial Study',st:'Prepare IS with mitigation measures',det:'Identifies potentially significant impacts and proposes enforceable mitigation. Meaningful AB 52 tribal consultation required — 2025 Koi Nation: must seek agreement, document process, respond to all proposed measures. New §21080.43–44: accept feasible VMT mitigation.',tm:'6–12 weeks',fee:'$15K–$60K'},
    {ph:'Public Notice',st:'NOI — 20 to 30-day review',det:'30-day review if submitted to State Clearinghouse. Includes draft MMRP.',tm:'20–30 days',fee:'$200–$500'},
    {ph:'Response',st:'Respond to public comments',det:'If a commenter raises a new significant impact not addressed, the project or analysis may require revision or elevation to EIR.',tm:'2–4 weeks'},
    {ph:'Adoption',st:'Adopt MND and MMRP',det:'Agency formally finds all impacts mitigated to less than significant. MMRP conditions attached to approval.',tm:'2–4 weeks'},
    {ph:'Filing',st:'File Notice of Determination (NOD)',det:'Within 5 days of approval. 30-day SOL.',tm:'5 days',fee:'$50 + CDFW $3,717.25'},
    {ph:'Approval',st:'Project approved with MMRP conditions',tm:'4–8 weeks (agency-dependent)'},
  ],
  ADDENDUM:[
    {ph:'Review',st:'Review prior certified document',det:'Confirm prior EIR or ND is still adequate. Document why §15162 Subsequent EIR thresholds are not triggered.',tm:'1–2 weeks',fee:'$3K–$10K'},
    {ph:'Preparation',st:'Prepare Addendum',det:'Brief document explaining why no new significant impacts exist. No public review required.',tm:'4–8 weeks',fee:'$10K–$40K'},
    {ph:'Adoption',st:'Agency approves Addendum',det:'Attached to prior certified document. No separate public hearing required.',tm:'2–4 weeks'},
    {ph:'Filing',st:'File Notice of Determination',det:'References prior certification. 30-day SOL.',tm:'5 days',fee:'$50'},
    {ph:'Approval',st:'Project approved',tm:'Varies by agency'},
  ],
  SUBSEQUENT_MND:[
    {ph:'Review',st:'Review prior MND and current conditions',det:'Assess what has changed. If changes are substantial, determine if Subsequent MND or EIR is appropriate under §15162.',tm:'1–2 weeks',fee:'$5K–$15K'},
    {ph:'Initial Study',st:'Updated Initial Study',det:'Focused on changes since prior MND. AB 52 consultation required again if tribal resources area is involved.',tm:'4–8 weeks',fee:'$15K–$50K'},
    {ph:'Public Notice',st:'NOI — 20 to 30-day review',det:'Same as new MND process. Prior MMRP is updated or replaced.',tm:'20–30 days',fee:'$200–$500'},
    {ph:'Adoption',st:'Adopt Subsequent MND and updated MMRP',det:'Findings must support all impacts still mitigated to less than significant.',tm:'2–4 weeks'},
    {ph:'Filing',st:'File Notice of Determination',det:'30-day SOL.',tm:'5 days',fee:'$50 + CDFW $3,717.25'},
  ],
  SUB_EIR:[
    {ph:'Scoping',st:'Notice of Preparation (NOP) — 30-day scoping',det:'Public, agencies, and tribes notified. Scoping identifies which new issues require analysis beyond prior EIR.',tm:'30 days',fee:'$200–$500'},
    {ph:'Preparation',st:'Prepare Draft Subsequent EIR',det:'Focused on new information or changed circumstances only. Does not repeat prior certified analysis.',tm:'3–6 months',fee:'$80K–$250K'},
    {ph:'Public Review',st:'45-day public review',det:'State Clearinghouse distribution required. Public hearing recommended.',tm:'45 days',fee:'$50 SCH'},
    {ph:'Response',st:'Prepare Final SEIR',det:'Written responses to all significant comments.',tm:'2–4 months',fee:'$30K–$80K'},
    {ph:'Certification',st:'Certify Final SEIR',det:'Adopt MMRP and Findings. SOC if significant unavoidable impacts remain.',tm:'4–8 weeks'},
    {ph:'Filing',st:'File Notice of Determination',det:'30-day SOL.',tm:'5 days',fee:'$50 + CDFW $3,717.25'},
  ],
  EIR:[
    {ph:'Scoping',st:'Notice of Preparation (NOP) — 30-day scoping',det:'Required public scoping. AB 52: tribes may accept consultation within 60 days; consultation concludes within 45 days (one 15-day extension at tribe\'s request). Sets full scope of analysis.',tm:'30 days',fee:'$200–$500'},
    {ph:'Preparation',st:'Prepare Draft EIR (DEIR)',det:'Full analysis of all Appendix G topics. VMT per §15064.3 (SB 743). §21080.43–44: accept feasible applicant VMT mitigation. Public agency: EIR contract executes within 45 days of NOP (§21151.5).',tm:'6–18 months',fee:'$150K–$900K+'},
    {ph:'Public Review',st:'45-day public review of Draft EIR',det:'60 days for large/complex projects. State Clearinghouse distribution. Public hearing required. All comments must receive substantive written responses.',tm:'45–60 days',fee:'$50–$100 SCH'},
    {ph:'Response',st:'Prepare Final EIR (FEIR)',det:'Written responses to all significant comments. Electronic record required (§21167.6 as amended 2025).',tm:'3–6 months',fee:'$50K–$200K'},
    {ph:'Certification',st:'Certify Final EIR',det:'Governing body certifies FEIR, makes Findings, adopts MMRP. SOC if significant unavoidable impacts remain. Public agencies: 1-year statutory limit from complete application (§21100.2).',tm:'4–8 weeks'},
    {ph:'Filing',st:'File Notice of Determination (NOD)',det:'Within 5 days of project approval. 30-day SOL begins.',tm:'5 days',fee:'$50 + CDFW $3,717.25'},
    {ph:'Approval',st:'Project approved with MMRP conditions',tm:'4–12 weeks (agency-dependent)'},
  ],
  PROGRAM_EIR:[
    {ph:'Scoping',st:'Extended NOP + multi-agency scoping',det:'Regional scoping, multiple public meetings, AB 52 tribal consultation throughout.',tm:'30–60 days',fee:'$500–$2,000'},
    {ph:'Preparation',st:'Prepare Draft Program EIR',det:'Broad policy-level analysis of full program area, all CEQA topics, range of alternatives, phasing scenarios.',tm:'12–30 months',fee:'$400K–$2M+'},
    {ph:'Public Review',st:'60-day public review',det:'Wide agency circulation, multiple public hearings.',tm:'60 days',fee:'$100 SCH'},
    {ph:'Response',st:'Prepare Final Program EIR',det:'Comprehensive responses. May require significant revisions.',tm:'4–8 months',fee:'$100K–$400K'},
    {ph:'Certification',st:'Certify Program EIR',det:'MMRP and Findings adopted. Foundation for future project tiering.',tm:'4–8 weeks'},
    {ph:'Future Tiering',st:'Subsequent project tiering enabled',det:'Future projects can tier off this PEIR via Addendum or focused IS — major time and cost savings.',tm:'Ongoing'},
    {ph:'Filing',st:'File Notice of Determination',det:'30-day SOL.',tm:'5 days',fee:'$50 + CDFW $3,717.25'},
  ],
};

const COSTS={
  NO_CEQA:{con:'$0',doc:'$0',fil:'$50',dfw:'$0',tot:'$50 (optional NOE)',note:'CEQA review is not required. Filing a Notice of Exemption (NOE) is optional but strongly recommended to trigger the 35-day statute of limitations and protect against later challenge. No technical studies are required by CEQA, though project-specific regulatory requirements (building code, grading permits, etc.) still apply.'},
  CAT_EXEMPT:{con:'$0–$5,000',doc:'$500–$2,000',fil:'$50',dfw:'$0',tech:'$5,000–$20,000',tot:'$5,550–$27,050',note:'Technical reports (cultural resources screening, hazmat database check) are required to confirm no exceptions apply, even with no formal CEQA document. Public agency reference: DJP & Associates (2026) estimated <$5,000 total for a public trail project where hazmat reports were already completed — private projects without prior studies may cost $15K–$30K more. File the NOE promptly to trigger the 35-day SOL.'},
  STATUTORY_EXEMPT:{con:'$0–$3,000',doc:'$500–$1,500',fil:'$50',dfw:'$0',tot:'$550–$4,550',note:'Confirm statutory basis with legal counsel. NOE filing is critical to start the limitations clock. For §21080.25 bike/ped exemption: no technical reports required if project is entirely in public ROW.'},
  ND:{con:'$20K–$60K',doc:'$10K–$25K',fil:'$250',dfw:'$3,717.25',tech:'$15,000–$30,000',tot:'$48,967–$118,967',note:'Cost includes cultural resources and hazmat technical studies, typically required even for an ND. Real-world reference: DJP & Associates (2026) estimated $75K–$100K for an IS/ND on a public trail project where hazmat reports were already completed — private project costs may be higher. Public agencies: CDFW fee may be waived. Private applicants: add agency processing fees ($2K–$15K) and full CDFW fee of $3,717.25.'},
  MND:{con:'$20K–$70K',doc:'$10K–$30K',fil:'$250',dfw:'$3,717.25',tech:'$15,000–$35,000',tot:'$48,967–$138,967',note:'MMRP preparation adds $5K–$15K. Technical reports (cultural, hazmat, biological, VMT as applicable) typically required. AB 52 tribal consultation adds $2K–$8K. Public agencies: CDFW fee may be waived; no separate processing fee. Private applicants: add agency processing fees ($2K–$20K). Mitigation implementation costs are separate from CEQA document costs.'},
  ADDENDUM:{con:'$15K–$50K',doc:'$5K–$20K',fil:'$50',dfw:'$0–$3,717',tot:'$20,050–$73,717',note:'Most cost-effective for projects with strong prior CEQA coverage. Key risk: prior document must still be adequate.'},
  SUBSEQUENT_MND:{con:'$25K–$75K',doc:'$10K–$30K',fil:'$250',dfw:'$3,717.25',tot:'$39,217–$109,217',note:'Cost depends on scope of new issues to analyze beyond the prior MND.'},
  SUB_EIR:{con:'$100K–$350K',doc:'$30K–$80K',fil:'$300',dfw:'$3,717.25',tot:'$134,317–$434,317',note:'Litigation risk remains elevated even after completion. Scope and age of prior document determine total cost.'},
  EIR:{con:'$200K–$950K',doc:'$50K–$200K',fil:'$300',dfw:'$3,717.25',tot:'$254,317–$1,154,317',note:'Private applicant bears all costs (PRC §21089). Agency staff time billed separately. Complex projects commonly exceed $1M.'},
  PROGRAM_EIR:{con:'$500K–$2M',doc:'$100K–$400K',fil:'$500',dfw:'$3,717.25',tot:'$604,217–$2,404,217',note:'Typically city/county-initiated. Investment enables faster, cheaper tiering for all future projects in the program area.'},
};

const TIMELINES={
  NO_CEQA:'1–5 days + 35-day SOL window',
  CAT_EXEMPT:'4–8 weeks (1–2 months)',STATUTORY_EXEMPT:'4–8 weeks (1–2 months)',ND:'5–7 months',
  MND:'5–9 months',ADDENDUM:'2–4 months',SUBSEQUENT_MND:'4–7 months',
  SUB_EIR:'8–18 months',EIR:'12–30 months',PROGRAM_EIR:'24–48 months'
};

// ═══════════════════════════════════════════════════════════
// DETERMINATION ENGINE
// ═══════════════════════════════════════════════════════════
function determineCEQA(){
  const q0=answers.q0,q1=answers.q1,q2=answers.q2,q3=answers.q3;
  const q4=answers.q4,q6=answers.q6,q6b=answers.q6b||'unknown',q7=answers.q7;
  const needsAcquisition=(q6b==='some_acquisition'||q6b==='all_acquisition'||q6b==='unknown');
  const q5=multiAnswers.q5||new Set();
  const isPublic=q0==='public';
  const hasBio=q5.has('bio'),hasHazmat=q5.has('hazmat'),hasCultural=q5.has('cultural');
  const hasTraffic=q5.has('traffic'),hasOld=q5.has('oldbuilding'),hasDem=q5.has('demolish');
  const hasFlood=q5.has('flood'),hasSlopes=q5.has('slopes'),hasFederal=q5.has('federal');
  const hasEnergy=q5.has('energy'),hasWildfire=q5.has('wildfire'),hasPaleo=q5.has('paleo'),hasAirport=q5.has('airport'),hasDrivethrough=q5.has('drivethrough');
  const anySig=hasBio||hasHazmat||hasCultural||hasTraffic||hasOld||hasFlood||hasSlopes||hasWildfire||hasPaleo||hasDrivethrough;
  const flagCount=[hasBio,hasHazmat,hasCultural,hasTraffic,hasFlood,hasWildfire].filter(Boolean).length;
  let primary,conservative,reasons=[];

  if(q4==='ministerial'){
    primary='NO_CEQA';conservative='STATUTORY_EXEMPT';
    reasons.push('CEQA does not apply to ministerial projects (PRC §21080(b)(1)). The agency must approve if code is met and has no discretion to impose conditions beyond code requirements. This is distinct from a statutory or categorical exemption — CEQA simply has no jurisdiction.');
    reasons.push('Filing a Notice of Exemption (NOE) is optional but strongly recommended to trigger the 35-day statute of limitations and prevent a 180-day challenge window.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q1==='residential_tod'&&q2!=='major'&&!anySig){
    primary='STATUTORY_EXEMPT';conservative='MND';
    reasons.push('SB 79 (2025, Gov. Code §65912.155+): Transit-oriented housing within ½ mile of a transit stop with 5+ units at 30+ du/ac may qualify for statutory exemption. Confirm all SB 79 conditions: density, labor standards, and distance requirements.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q1==='adaptive_reuse'&&q2!=='major'&&!anySig){
    primary='STATUTORY_EXEMPT';conservative='MND';
    reasons.push('AB 507 (2025): Office/commercial-to-residential adaptive reuse on sites ≤20 acres with an affordable housing component qualifies as "use by right" — exempt from CEQA. Does not apply to industrial buildings or active hotels.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q6==='specific'&&q2!=='major'&&!anySig){
    primary=q7==='flexible'?'SUB_EIR':'ADDENDUM';conservative='SUB_EIR';
    reasons.push('A certified Specific Plan EIR covers this project area. An Addendum (§15164) is appropriate when no new or substantially more severe impacts exist and §15162 Subsequent EIR thresholds are not triggered.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q6==='prior_mnd'){
    if(!anySig&&q2!=='large'&&q2!=='major'){
      primary='ADDENDUM';conservative='SUBSEQUENT_MND';
      reasons.push('A prior MND was certified. If conditions haven\'t substantially changed and no new significant impacts exist, an Addendum (§15164) may be appropriate.');
      reasons.push('If the project has changed substantially or new information reveals impacts not addressed in the prior MND, a Subsequent MND (§15162) is required.');
    } else {
      primary='SUBSEQUENT_MND';conservative='EIR';
      reasons.push('A prior MND exists, but project size or environmental features suggest conditions may have changed substantially since adoption.');
      reasons.push('A Subsequent MND under §15162 is required when new information shows previously approved mitigation will not be as effective, or when project changes are substantial.');
    }
    return {primary,conservative,reasons,isPublic};
  }
  if(q6==='prior_is'){
    primary='MND';conservative='EIR';
    reasons.push('A prior Initial Study was completed but not finalized. If the project description and site conditions are substantially similar, the prior analysis may be incorporated by reference (§15150) with an updated IS.');
    reasons.push('The agency must verify the prior IS is no more than ~3–5 years old and that no significant changes in site conditions, regulations, or project scope have occurred.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q6==='program'&&q2==='small'&&!anySig){
    primary='ADDENDUM';conservative='MND';
    reasons.push('Small project within a Program EIR area with no new significant impacts — an Addendum to the prior document is most efficient.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q2==='major'){
    if(q4==='gpa'){primary='PROGRAM_EIR';conservative='PROGRAM_EIR';}
    else{primary='EIR';conservative='PROGRAM_EIR';}
    reasons.push('Project scale (500+ units or 100,000+ sq ft) exceeds major thresholds requiring mandatory EIR-level analysis.');
    if(isPublic)reasons.push('Public agency: 1-year statutory deadline to certify the EIR (§21100.2/§21151.5). EIR consultant contract must execute within 45 days of NOP.');
    if(anySig)reasons.push('Multiple environmental features further confirm EIR-level analysis is needed.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q4==='gpa'){
    primary='EIR';conservative='PROGRAM_EIR';
    reasons.push('A General Plan Amendment or rezoning is a legislative act requiring full EIR analysis of alternatives.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q3==='sensitive'&&(hasBio||hasCultural)){
    primary='EIR';conservative='EIR';
    reasons.push('Project in a sensitive resource area with biological or cultural resources — typically cannot be fully mitigated through an MND under the substantial evidence standard (§15064).');
    return {primary,conservative,reasons,isPublic};
  }
  if(hasWildfire&&(q2==='large'||q2==='major'||q3==='greenfield')){
    primary='EIR';conservative='EIR';
    reasons.push('Project in a wildfire hazard zone at significant scale — 2020 Appendix G Wildfire section requires analysis of evacuation route impacts, fire risk exacerbation, and post-fire slope instability. These impacts are difficult to mitigate to less-than-significant through an MND at this scale.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q3==='greenfield'&&(q2==='large'||anySig)){
    primary='EIR';conservative='PROGRAM_EIR';
    reasons.push('Development on undeveloped land at this scale or with these environmental features is likely to generate significant impacts requiring EIR-level analysis.');
    return {primary,conservative,reasons,isPublic};
  }
  if(hasDem||hasOld){
    // Demolition triggers historic resource evaluation regardless of project size.
    // CEQA measures the whole action — a large demolition + small new build is still significant.
    if(hasOld||hasDem){
      reasons.push('Demolition of an existing structure requires a historic resource evaluation (§15064.5). If the structure is 45+ years old, DPR 523 forms prepared by a qualified historic resources consultant are required to determine significance.');
    }
    if(hasDem&&q2==='small'){
      // Small new build but significant demolition — warn user about size selection
      reasons.push('Note: if the demolished structure is larger than the new building, the project scale should be assessed based on the larger of the two (total site disturbance, not just new construction area). This may affect the appropriate CEQA pathway.');
      primary='MND';conservative='EIR';
      return {primary,conservative,reasons,isPublic};
    }
    primary=q7==='flexible'?'EIR':'MND';conservative='EIR';
    reasons.push('If the structure is determined to be a historical resource, project redesign or EIR-level analysis will be required.');
    return {primary,conservative,reasons,isPublic};
  }
  if((q1==='residential'||q1==='renovation')&&q2==='small'&&q3==='infill'&&!anySig&&q4!=='gpa'){
    primary='CAT_EXEMPT';conservative='ND';
    reasons.push('Small infill project on a previously developed site likely qualifies under the Class 32 Infill Exemption (§15332) or the Class 1 Existing Facilities Exemption (§15301).');
    reasons.push('§15332 requires: site ≤5 acres in urbanized area, consistent with GP/zoning, no significant traffic, noise, air, water, or hazmat impacts. No historic resources (§15300.2(f)).');
    if(isPublic)reasons.push('Public agency: file NOE promptly after determination (§21108). CDFW fee generally waived for public projects.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q1==='renovation'&&q2==='small'&&!anySig){
    primary='CAT_EXEMPT';conservative='ND';
    reasons.push('Minor renovation to an existing structure likely qualifies under the Class 1 Categorical Exemption (§15301 Existing Facilities).');
    return {primary,conservative,reasons,isPublic};
  }
  if((q1==='infrastructure'||q1==='institutional')&&q2==='small'&&!anySig&&q3==='infill'){
    if(!needsAcquisition||q6b==='public_owned'){
      // Stat exempt possible — no private parcel
      primary='CAT_EXEMPT';conservative='ND';
      reasons.push('Small public improvement in a developed area qualifies under Class 1 (§15301 Existing Facilities) or Class 4 (§15304 Minor Alterations to Land — trail construction, grading). For bike/ped/trail projects entirely within public ROW, §21080.25(b)(1) Statutory Exemption may also apply.');
      if(isPublic)reasons.push('Public agency: file NOE promptly. Technical studies (cultural resources screening, hazmat database check) are recommended before relying on Cat. Exemption to confirm no exceptions apply (§15300.2).');
    } else {
      // Private parcel involved — Stat. Ex. blocked, use Cat. Ex. only
      primary='CAT_EXEMPT';conservative='MND';
      reasons.push('Small public improvement qualifies for a Categorical Exemption (§15301 or §15304). Note: because private parcel acquisition is involved, the Statutory Exemption under §21080.25(b)(1) is NOT available — that exemption applies only when the project is entirely within public right-of-way.');
      reasons.push('Technical studies (cultural resources, hazmat database check) are required to confirm no Cat. Exemption exceptions apply.');
    }
    return {primary,conservative,reasons,isPublic};
  }
  if(flagCount>=3){
    primary='EIR';conservative='PROGRAM_EIR';
    reasons.push('Three or more significant environmental concerns identified. This complexity warrants a full EIR rather than attempting comprehensive mitigation through an MND, which would carry high litigation risk.');
    return {primary,conservative,reasons,isPublic};
  }
  if(hasFederal){
    reasons.push('Federal funding or permits involved — NEPA review is required in parallel with CEQA. Coordinate with the federal agency to determine NEPA level (CE, EA, or EIS). A Joint EIR-EIS (§15170) may be possible.');
  }
  if(q2==='large'&&q3==='infill'&&!anySig){
    primary=q7==='flexible'?'EIR':'MND';conservative='EIR';
    reasons.push('Large infill project may qualify for MND if all impacts can be mitigated, but EIR provides stronger legal protection at this scale.');
    if(isPublic)reasons.push('Public agency: 1-year EIR or 180-day ND statutory limit begins from when the project proposal is deemed complete.');
    return {primary,conservative,reasons,isPublic};
  }
  if(anySig&&q2!=='small'){
    primary=q7==='flexible'?'EIR':'MND';conservative='EIR';
    reasons.push('Potentially significant environmental impacts require formal analysis and mitigation:');
    if(hasBio)reasons.push('Biological resources: Biological assessment required. CDFW and/or USACE consultation if sensitive species or wetlands present.');
    if(hasHazmat)reasons.push('Contamination: Phase I (and possibly Phase II) Environmental Site Assessment required. Remediation may be needed before construction.');
    if(hasCultural)reasons.push('Historic/tribal: Historic resource evaluation required. AB 52 consultation is mandatory and must be meaningful per the 2025 Koi Nation ruling — document all steps.');
    if(hasTraffic)reasons.push('VMT: Post-SB 743 VMT analysis required per §15064.3. New §21080.43–44 require agencies to accept feasible VMT mitigation from applicants.');
    if(hasFederal)reasons.push('Federal involvement: Contact federal agency for NEPA requirements. Combined CEQA/NEPA (Joint EIR-EIS, §15170) may be possible.');
  if(hasDrivethrough)reasons.push('Drive-through lanes or extended vehicle idling: An Air Quality Study and Health Risk Assessment (HRA) is required under BAAQMD CEQA Guidelines when idling vehicles are located near sensitive receptors (residences, schools, daycares). This is a Bay Area-specific trigger — always consult the applicable air district guidelines.');
  if(hasWildfire)reasons.push('Wildfire hazard: Project in or near a State Responsibility Area or Very High Fire Hazard Severity Zone — analysis required under 2020 Appendix G. Must address emergency evacuation, fire risk exacerbation, and post-fire slope/drainage instability.');
  if(hasEnergy)reasons.push('Energy: Wasteful energy consumption or conflict with renewable energy plans must be analyzed under the 2020 Appendix G Energy section (SB 100 and climate goals context).');
  if(hasPaleo)reasons.push('Paleontological resources: If grading will disturb undisturbed geological formations, a paleontological resources evaluation may be required (2020 Appendix G, Geology/Soils §VI(f)).');
  if(hasAirport)reasons.push('Airport proximity: Safety hazard and excessive noise analysis required for projects within airport land use plans or within 2 miles of a public airport (Appendix G §VIII(e), §XII(c)).');
  // Acquisition-related reason
  if(needsAcquisition&&q6b!=='unknown')reasons.push('Land acquisition is required. CEQA must analyze displacement and relocation impacts under §15064(h). If eminent domain is involved, a resolution of necessity under CCP §1245.220 is required.');
  if(q6b==='all_acquisition')reasons.push('Full site acquisition program: the CEQA document must address the Uniform Relocation Assistance Act (42 U.S.C. §4601) if federal funds are involved, and the Surplus Lands Act (Gov. Code §54220+) for public land.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q2==='small'&&anySig){
    primary='MND';conservative='EIR';
    reasons.push('Small project with potential environmental impacts may be addressed through mitigation in an MND.');
    return {primary,conservative,reasons,isPublic};
  }
  if(q2==='medium'&&q3==='infill'&&!anySig){
    primary='ND';conservative='MND';
    reasons.push('Medium infill project on previously developed site with no environmental features is a strong Negative Declaration candidate after Initial Study.');
    if(isPublic)reasons.push('Public agency: 180-day statutory limit for completing and adopting the ND from complete application date (§21151.5).');
    return {primary,conservative,reasons,isPublic};
  }
  primary='MND';conservative='EIR';
  reasons.push('Based on this project profile, an Initial Study and MND is the most likely pathway, subject to IS findings.');
  reasons.push('Note: if the IS identifies impacts that cannot be fully mitigated, the project must be elevated to EIR.');
  return {primary,conservative,reasons,isPublic};
}

// ═══════════════════════════════════════════════════════════
// RESULTS RENDERING
// ═══════════════════════════════════════════════════════════
function calculateResults(){
  const det=determineCEQA();
  deterResult=det;
  const P=CT[det.primary],C=CT[det.conservative];
  const PC=COSTS[det.primary],CC=COSTS[det.conservative];
  const q5=multiAnswers.q5||new Set();
  const q5tags=[...q5].filter(v=>v!=='none').map(v=>`<span class="tag tag-blue">${eLabel(v)}</span>`).join('');
  const applicantTag=det.isPublic?`<span class="tag tag-purple">Public agency</span>`:`<span class="tag tag-green">Private applicant</span>`;
  document.getElementById('printDate').textContent=new Date().toLocaleDateString();

  // Summary bar
  document.getElementById('summary-bar').innerHTML=`<strong>Your project at a glance</strong>
    ${applicantTag}<span class="tag tag-blue">${lType(answers.q1)}</span><span class="tag tag-blue">${lSize(answers.q2)}</span><span class="tag tag-blue">${lLoc(answers.q3)}</span><span class="tag tag-blue">${lApproval(answers.q4)}</span>${q5tags}
    &nbsp;→&nbsp; <strong>Recommended: ${P.name} (${P.abbr})</strong>`;

  // Applicant note
  const appNote=det.isPublic
    ?`<div class="public-note">📋 <strong>Public agency:</strong> You prepare CEQA in-house or by contract (§21100/§21151). Key limits: 1 year to certify EIR, 180 days to complete ND/MND (§21151.5). EIR contract must execute within 45 days of NOP. CDFW fee generally waived for public projects. Budget CEQA costs in your project request (§21106).</div>`
    :`<div class="private-note">📋 <strong>Private applicant:</strong> The agency leads CEQA; you pay all costs under PRC §21089. 2026 CDFW fee: $3,717.25. Submit a complete application to start the statutory clock. Time limits run from complete-application date.</div>`;

  // ── PRIMARY RESULT ──
  document.getElementById('primary-result').innerHTML=`
    <div class="result-primary-badge" style="${det.primary==='NO_CEQA'?'background:var(--green)':''}">${det.primary==='NO_CEQA'?'CEQA Does Not Apply':'Recommended pathway'}</div>
    <div class="result-primary-title">${P.name}</div>
    <div class="result-primary-auth">${P.auth}</div>
    <p style="font-size:14px;color:var(--text-muted);margin-bottom:1rem">${P.desc}</p>
    ${appNote}
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--navy);margin-bottom:8px">Why this pathway</div>
    <ul style="list-style:none;display:flex;flex-direction:column;gap:6px;margin-bottom:1rem">
      ${det.reasons.map(r=>`<li style="font-size:13px;color:var(--text-muted);display:flex;gap:8px;align-items:flex-start"><span style="color:var(--green);flex-shrink:0;margin-top:1px">✓</span><span>${r}</span></li>`).join('')}
    </ul>`;

  // ── CONSERVATIVE RESULT (collapsed) ──
  document.getElementById('con-title-preview').textContent=C.name;
  document.getElementById('con-abbr-preview').textContent=`${C.abbr} — Higher legal protection · ${TIMELINES[det.conservative]} · Est. ${CC.tot}`;
  document.getElementById('con-body').innerHTML=`
    <div class="result-con-hint">💡 <strong>When to choose this instead:</strong> If this project may face public opposition, a similar nearby project was challenged in court, or your agency has a policy of extra caution. The conservative option provides stronger legal defensibility at higher cost and time.</div>
    <div style="font-size:14px;color:var(--text-muted);margin-bottom:1rem">${C.desc}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1rem">
      <div style="background:var(--bg);border-radius:8px;padding:.75rem 1rem;border:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:var(--text-muted);margin-bottom:4px">Conservative cost est.</div>
        <div style="font-size:16px;font-weight:600;color:var(--red)">${CC.tot}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:.75rem 1rem;border:1px solid var(--border)">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:var(--text-muted);margin-bottom:4px">Conservative timeline</div>
        <div style="font-size:16px;font-weight:600;color:var(--amber)">${TIMELINES[det.conservative]}</div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:.5rem"><strong>Authority:</strong> ${C.auth}</div>
    <div style="font-size:12px;color:var(--text-muted)"><strong>CDFW fee (2026):</strong> ${CC.dfw} &nbsp;|&nbsp; <strong>Consultant est.:</strong> ${CC.con} &nbsp;|&nbsp; <strong>SOL after filing:</strong> 30 days (NOD)</div>`;

  // ── COST CARD ──
  document.getElementById('cost-result').innerHTML=`
    <span class="result-badge badge-navy">Cost estimate — ${P.abbr}</span>
    <div class="result-title" style="font-size:17px;margin-bottom:.9rem">Recommended cost breakdown (2026)</div>
    <div class="cost-item"><span class="cost-label">CEQA consultant or firm</span><span>${PC.con}</span></div>
    <div class="cost-item"><span class="cost-label">Document preparation</span><span>${PC.doc}</span></div>
    ${PC.tech?`<div class="cost-item"><span class="cost-label" style="font-style:italic">Technical reports (cultural, hazmat)</span><span>${PC.tech}</span></div>`:''}
    <div class="cost-item"><span class="cost-label">Filing fees (NOE/NOD)</span><span>${PC.fil}</span></div>
    <div class="cost-item"><span class="cost-label">CDFW fee (2026 rate)</span><span>${PC.dfw}</span></div>
    <div class="cost-total"><span>Estimated total</span><span>${PC.tot}</span></div>
    <p style="font-size:11px;color:var(--text-muted);margin-top:8px">${PC.note}</p>
    ${det.isPublic?`<p style="font-size:11px;color:var(--purple);margin-top:5px">Public agency: CDFW fee typically waived for purely public projects. Confirm with CDFW.</p>`:''}
    <div style="margin-top:.9rem;padding-top:.75rem;border-top:1px solid #f0f0f0;font-size:12px;color:var(--text-muted)">Conservative alt. (${C.abbr}): <strong style="color:var(--red)">${CC.tot}</strong></div>`;

  // ── SUMMARY TABLE ──
  document.getElementById('summary-table').innerHTML=`
    <span class="result-badge badge-green">Your answers</span>
    <table class="data-table"><thead><tr><th>Question</th><th>Your answer</th></tr></thead><tbody>
      <tr><td>Applicant type</td><td>${det.isPublic?'Public agency':'Private applicant'}</td></tr>
      <tr><td>Project type</td><td>${lType(answers.q1)}</td></tr>
      <tr><td>Project size</td><td>${lSize(answers.q2)}</td></tr>
      <tr><td>Site conditions</td><td>${lLoc(answers.q3)}</td></tr>
      <tr><td>Approval needed</td><td>${lApproval(answers.q4)}</td></tr>
      <tr><td>Project features</td><td>${lEnvFull()}</td></tr>
      <tr><td>Prior CEQA</td><td>${lPrior(answers.q6)}</td></tr>
      <tr><td>Timeline pref.</td><td>${lTimeline(answers.q7)}</td></tr>
    </tbody></table>`;

  // ── FLOW CHART ──
  renderFlow('rec');
  goToSection(9);
  hasUnsavedProgress=false;
}

function renderFlow(which){
  const det=deterResult;
  if(!det)return;
  const key=which==='rec'?det.primary:det.conservative;
  const steps=FLOWS[key]||[];
  const label=CT[key].name;
  let html=`<div class="flow-title">Process steps — ${label}</div><div>`;
  steps.forEach((step,i)=>{
    html+=`<div class="flow-step"><div class="flow-phase">${step.ph}</div>
      <div class="flow-step-body"><strong>${step.st}</strong><p>${(step.det||'')}${step.fee?` <em>Fee: ${step.fee}</em>`:''}</p></div>
      <div class="flow-time"><strong>${step.tm}</strong><span>duration</span></div></div>`;
    if(i<steps.length-1)html+=`<div class="flow-arrow">↓</div>`;
  });
  html+=`</div><div class="flow-total">
    <div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--navy-mid);margin-bottom:2px">Total estimated timeline</div>
    <div style="font-size:22px;font-weight:600;color:var(--navy)">${TIMELINES[key]}</div></div>
    <div style="font-size:12px;color:var(--text-muted);max-width:360px">Statutory minimums only. Actual processing depends on agency workload. Contact the lead agency early to understand current review backlogs.</div>
  </div>`;
  document.getElementById('flow-content').innerHTML=html;
}

function switchFlow(which){
  document.getElementById('flowTabRec').classList.toggle('active',which==='rec');
  document.getElementById('flowTabCon').classList.toggle('active',which==='con');
  renderFlow(which);
}

function toggleConservative(){
  const el=document.getElementById('conservative-result');
  el.classList.toggle('expanded');
}

// ═══════════════════════════════════════════════════════════
// GOOGLE AUTH (demo — replace with real OAuth2 in production)
// ═══════════════════════════════════════════════════════════
// signInWithGoogle: reserved for future use
// renderAuthArea + signOut: reserved for future use
;

// processPayment: reserved for future use

// saveProgressNow: reserved for future use


// ═══════════════════════════════════════════════════════════
// FEEDBACK MODAL — anonymous, no login required
// ═══════════════════════════════════════════════════════════
// In production: submit to a backend endpoint (e.g. a simple serverless function
// or form service like Formspree / Netlify Forms) using a POST request with only
// the rating, category, and text — NO user IP or identifying information logged.
// The server sends a notification email to the owner. No personal data collected.
function openFeedback(preRating){
  const modal = document.getElementById('feedback-modal');
  if(!modal) return;
  modal.style.display = 'flex';

  // Reset state
  feedbackRating = preRating || 0;
  feedbackCats   = [];

  // Clear text fields
  const nameEl  = document.getElementById('feedback-name');
  const emailEl = document.getElementById('feedback-email');
  const textEl  = document.getElementById('feedback-text');
  if(nameEl)  nameEl.value  = '';
  if(emailEl) emailEl.value = '';
  if(textEl)  textEl.value  = '';

  // Restore body to form state (in case success/error screen is showing)
  const body = document.getElementById('feedback-body');
  if(body) body.style.display = 'block';

  // Reset star and cat buttons
  document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('lit'));
  document.querySelectorAll('.cat-btn').forEach(b  => b.classList.remove('selected'));

  // Pre-light stars if a rating was passed in from the inline quick-rate
  if(preRating){
    document.querySelectorAll('.star-btn').forEach(b => {
      if(parseInt(b.dataset.v) <= preRating) b.classList.add('lit');
    });
  }
}

function quickRate(n){
  document.querySelectorAll('.inline-star').forEach((s,i) => {
    s.style.color = i < n ? 'var(--gold)' : '#DDD';
  });
  setTimeout(() => openFeedback(n), 300);
}

function closeFeedback(){
  const modal = document.getElementById('feedback-modal');
  if(modal) modal.style.display = 'none';
}

function rateStar(n){
  feedbackRating = n;
  document.querySelectorAll('.star-btn').forEach(b => {
    b.classList.toggle('lit', parseInt(b.dataset.v) <= n);
  });
}

function toggleCat(btn, cat){
  btn.classList.toggle('selected');
  if(feedbackCats.includes(cat)) feedbackCats = feedbackCats.filter(c => c !== cat);
  else feedbackCats.push(cat);
}

// ═══════════════════════════════════════════════════════════
// FEEDBACK — Formspree endpoint: https://formspree.io/f/xvzleowl
// Every submission is emailed to the owner and stored in the
// Formspree dashboard at formspree.io/forms with full timestamps.
// Fields: name, email, rating, categories, message, page context.
// ═══════════════════════════════════════════════════════════
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzleowl';

function submitFeedback(){
  const nameVal  = (document.getElementById('feedback-name')?.value  || '').trim();
  const emailVal = (document.getElementById('feedback-email')?.value || '').trim();
  const textVal  = (document.getElementById('feedback-text')?.value  || '').trim();

  // Build human-readable Pacific-time timestamp
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    timeZone:    'America/Los_Angeles',
    year:        'numeric',
    month:       'long',
    day:         'numeric',
    hour:        '2-digit',
    minute:      '2-digit',
    second:      '2-digit',
    timeZoneName:'short'
  });

  const starLabels = {
    1:'★☆☆☆☆ Not useful',
    2:'★★☆☆☆ Slightly useful',
    3:'★★★☆☆ Somewhat useful',
    4:'★★★★☆ Very useful',
    5:'★★★★★ Extremely useful'
  };
  const stepLabels = {
    0:'Home',1:'Applicant type',2:'Project type',3:'Size',
    4:'Site conditions',5:'Approvals',6:'Features',
    7:'Land ownership',8:'Prior CEQA',9:'Results page'
  };

  // Build payload — Formspree maps these fields into the email body
  const payload = {
    name:         nameVal  || '(anonymous)',
    email:        emailVal || '(not provided)',
    rating:       starLabels[feedbackRating] || 'No rating given',
    categories:   feedbackCats.length ? feedbackCats.join(', ') : 'None selected',
    message:      textVal  || '(no message)',
    page_context: stepLabels[currentSection] || `Step ${currentSection}`,
    submitted_at: timestamp,
    // Formspree uses _subject for the email subject line
    _subject: `CEQA Feedback — ${starLabels[feedbackRating] || 'No rating'} — ${timestamp}`,
    // Suppress Formspree's default redirect (we handle the UI ourselves)
    _next: 'false'
  };

  // Disable send button while submitting
  const sendBtn = document.querySelector('#feedback-modal .btn-primary');
  if(sendBtn){ sendBtn.disabled = true; sendBtn.textContent = 'Sending…'; }

  fetch(FORMSPREE_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body:    JSON.stringify(payload)
  })
  .then(res => {
    if(res.ok){
      // ── SUCCESS ──────────────────────────────────────────
      document.getElementById('feedback-body').innerHTML = `
        <div class="feedback-success">
          <div class="checkmark" style="background:var(--green-light);color:var(--green)">✓</div>
          <div style="font-size:18px;font-weight:600;color:var(--navy);margin-bottom:.5rem;font-family:'DM Serif Display',serif">
            Thank you — this really helps.
          </div>
          <p style="font-size:13px;color:var(--text-muted);line-height:1.7;max-width:340px;margin:0 auto">
            Your feedback was received and will be reviewed personally. Every response
            is used to make this tool more accurate and useful for California planners
            and applicants like you.
          </p>
          ${emailVal ? `<p style="font-size:12px;color:var(--text-muted);margin-top:.6rem">We'll reply to <strong>${emailVal}</strong> if follow-up is needed.</p>` : ''}
          <p style="font-size:11px;color:var(--text-muted);margin-top:.75rem;opacity:.75">
            Submitted ${timestamp}
          </p>
        </div>`;
      setTimeout(closeFeedback, 3500);
    } else {
      // ── SERVER ERROR ──────────────────────────────────────
      res.json().then(data => {
        showFeedbackError(sendBtn, data.error || `Server error (${res.status})`);
      }).catch(() => {
        showFeedbackError(sendBtn, `Server error (${res.status})`);
      });
    }
  })
  .catch(() => {
    // ── NETWORK ERROR ─────────────────────────────────────
    showFeedbackError(sendBtn, 'Network error — please check your connection and try again.');
  });
}

function showFeedbackError(sendBtn, message){
  // Re-enable button
  if(sendBtn){ sendBtn.disabled = false; sendBtn.textContent = 'Try again'; }
  // Show error banner above the footer without replacing the form
  const existing = document.getElementById('feedback-error-banner');
  if(existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'feedback-error-banner';
  banner.style.cssText = 'background:var(--red-light);border:1px solid #e5a090;border-radius:8px;padding:.65rem .9rem;font-size:12px;color:var(--red);line-height:1.6;margin-top:.75rem;display:flex;align-items:flex-start;gap:8px';
  banner.innerHTML = `<span style="flex-shrink:0;font-size:14px">⚠</span><span><strong>Submission failed.</strong> ${message}<br>If this keeps happening, email your feedback directly to <a href="mailto:support@ceqanavigator.com" style="color:var(--red);font-weight:500">support@ceqanavigator.com</a></span>`;
  const body = document.getElementById('feedback-body');
  if(body) body.appendChild(banner);
}

// ═══════════════════════════════════════════════════════════
// PDF DOWNLOAD — generates a standalone HTML file the user
// can open in any browser and print/save as PDF from there.
// window.print() is blocked in sandboxed iframes so we build
// a self-contained document and trigger a blob download.
// ═══════════════════════════════════════════════════════════
function downloadPDF(){
  const dateStr = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});

  // Collect rendered result HTML from the live DOM
  const summaryBar   = document.getElementById('summary-bar')?.innerHTML || '';
  const primaryRes   = document.getElementById('primary-result')?.innerHTML || '';
  const conTitle     = document.getElementById('con-title-preview')?.textContent || '';
  const conAbbr      = document.getElementById('con-abbr-preview')?.textContent || '';
  const conBody      = document.getElementById('con-body')?.innerHTML || '';
  const costRes      = document.getElementById('cost-result')?.innerHTML || '';
  const summTable    = document.getElementById('summary-table')?.innerHTML || '';
  const flowContent  = document.getElementById('flow-content')?.innerHTML || '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>CEQA Navigator — Pathway Report — ${dateStr}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --gold:#C8960C;--gold-light:#F5E9C4;--gold-pale:#FBF6E8;
  --navy:#1A2744;--navy-mid:#2D3F6B;--navy-light:#E8EDF8;
  --green:#1B6B44;--green-light:#E4F2EC;
  --red:#B03020;--red-light:#FAEAE7;
  --amber:#8A5A00;--amber-light:#FEF3DC;
  --purple:#4B3097;--purple-light:#EDE9FB;
  --text:#1A1A1A;--text-muted:#555;
  --border:#DDD;--bg:#FAFAF8;--card:#FFF;
  --radius:10px;
}
body{font-family:'DM Sans',sans-serif;background:#fff;color:var(--text);font-size:13px;line-height:1.6;padding:0;margin:0}

/* PAGE HEADER */
.pdf-header{background:var(--navy);color:#fff;padding:1.1rem 2rem;display:flex;align-items:center;justify-content:space-between}
.pdf-logo{display:flex;align-items:center;gap:9px}
.pdf-logo-icon{width:30px;height:30px;background:var(--gold);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:var(--navy);flex-shrink:0}
.pdf-logo-text{font-family:'DM Serif Display',serif;font-size:17px}
.pdf-meta{font-size:11px;opacity:.65;text-align:right}

/* CONTENT */
.pdf-body{max-width:900px;margin:0 auto;padding:1.5rem 2rem 3rem}
.pdf-title{font-family:'DM Serif Display',serif;font-size:22px;color:var(--navy);margin-bottom:.2rem}
.pdf-subtitle{font-size:11px;color:var(--text-muted);margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--border)}

/* SUMMARY BAR */
.summary-bar{background:var(--gold-pale);border:1px solid var(--gold);border-radius:9px;padding:.75rem 1.1rem;margin-bottom:1rem;font-size:12px;color:var(--amber)}
.summary-bar strong{display:block;font-size:13px;color:var(--navy);margin-bottom:3px}
.tag{display:inline-flex;align-items:center;font-size:11px;font-weight:500;padding:2px 7px;border-radius:10px;margin:2px}
.tag-blue{background:var(--navy-light);color:var(--navy-mid)}
.tag-green{background:var(--green-light);color:var(--green)}
.tag-purple{background:var(--purple-light);color:var(--purple)}

/* CARDS */
.result-primary{background:var(--card);border:2px solid var(--navy-mid);border-radius:var(--radius);padding:1.25rem 1.5rem;margin-bottom:1rem}
.result-primary-badge{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;padding:3px 10px;border-radius:20px;background:var(--navy);color:#fff;margin-bottom:.75rem}
.result-primary-title{font-family:'DM Serif Display',serif;font-size:20px;color:var(--navy);margin-bottom:.2rem}
.result-primary-auth{font-size:11px;color:var(--text-muted);margin-bottom:.9rem}
.result-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem 1.5rem}
.result-badge{display:inline-block;font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;padding:2px 9px;border-radius:20px;margin-bottom:.6rem}
.badge-navy{background:var(--navy-light);color:var(--navy)}
.badge-green{background:var(--green-light);color:var(--green)}
.result-title{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);margin-bottom:.2rem}
.result-subtitle{font-size:11px;color:var(--text-muted);margin-bottom:.75rem}
.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}
.result-conservative{background:var(--card);border:1.5px solid #e5c87a;border-radius:var(--radius);margin-bottom:1rem;overflow:hidden}
.result-con-header{display:flex;align-items:center;justify-content:space-between;padding:.85rem 1.25rem;background:var(--amber-light)}
.result-con-badge{font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:2px 8px;border-radius:20px;background:var(--amber-light);color:var(--amber);border:1px solid #e5c87a}
.result-con-title{font-weight:600;font-size:14px;color:var(--amber);margin-left:10px}
.result-con-abbr{font-size:11px;color:var(--text-muted);margin-left:10px;margin-top:1px}
.result-con-body{padding:1rem 1.25rem;border-top:1px solid #f0e8d0;display:block}
.result-con-hint{font-size:11px;color:var(--amber);background:var(--amber-light);border-radius:6px;padding:6px 9px;margin-bottom:.75rem}

/* DATA TABLE */
.data-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:.6rem}
.data-table th{text-align:left;padding:5px 8px;background:var(--navy-light);color:var(--navy);font-weight:600;font-size:10px;letter-spacing:.3px;text-transform:uppercase}
.data-table td{padding:6px 8px;border-bottom:1px solid #f0f0f0;vertical-align:top}
.data-table tr:last-child td{border-bottom:none}

/* COST */
.cost-item{display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;border-bottom:1px solid #f0f0f0;font-size:12px}
.cost-item:last-child{border-bottom:none}
.cost-label{color:var(--text-muted)}
.cost-total{display:flex;justify-content:space-between;align-items:baseline;padding:8px 0 0;border-top:2px solid var(--navy);font-size:13px;font-weight:600;color:var(--navy);margin-top:3px}

/* FLOW */
.flow-container{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem 1.5rem;margin-bottom:1rem}
.flow-title{font-family:'DM Serif Display',serif;font-size:16px;color:var(--navy);margin-bottom:.9rem}
.flow-step{display:grid;grid-template-columns:85px 1fr 90px;gap:10px;align-items:start;padding:9px 0;border-bottom:1px solid #f0f0f0}
.flow-step:last-child{border-bottom:none}
.flow-phase{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:var(--text-muted);padding-top:1px}
.flow-step-body strong{display:block;font-weight:500;font-size:12px;color:var(--text)}
.flow-step-body p{font-size:11px;color:var(--text-muted);margin-top:1px}
.flow-time{text-align:right;font-size:11px;padding-top:1px}
.flow-time strong{display:block;font-weight:600;color:var(--navy)}
.flow-time span{color:var(--text-muted)}
.flow-arrow{text-align:center;color:var(--border);padding:1px 0;grid-column:1/-1;font-size:13px}
.flow-total{margin-top:1rem;padding:.85rem 1rem;background:var(--navy-light);border-radius:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}

/* DISCLAIMER */
.disclaimer-box{background:#fff8f0;border:1.5px solid #e0a060;border-radius:8px;padding:.85rem 1rem;margin-top:1rem;display:flex;gap:9px;align-items:flex-start}
.disclaimer-title{font-size:10px;font-weight:700;color:#8a4010;margin-bottom:2px;text-transform:uppercase;letter-spacing:.4px}
.disclaimer-text{font-size:11px;color:#5a3010;line-height:1.6}
.disclaimer-agency{background:var(--amber-light);border:1px solid #e0c070;border-radius:8px;padding:.75rem 1rem;font-size:11px;color:var(--amber);margin-top:.6rem;line-height:1.6}

/* NOTES */
.public-note{background:var(--purple-light);border:1px solid #c4b8f0;border-radius:7px;padding:.55rem .85rem;font-size:11px;color:var(--purple);margin-bottom:.85rem}
.private-note{background:var(--green-light);border:1px solid #a8d5be;border-radius:7px;padding:.55rem .85rem;font-size:11px;color:var(--green);margin-bottom:.85rem}

/* PRINT BUTTON AREA */
.print-cta{background:var(--navy-light);border-radius:8px;padding:.85rem 1rem;margin-top:1rem;text-align:center;font-size:12px;color:var(--navy-mid)}

/* FOOTER */
.pdf-footer{background:var(--navy);color:rgba(255,255,255,.55);padding:.85rem 2rem;font-size:10px;display:flex;justify-content:space-between;align-items:center;margin-top:2rem}

@media print{
  .print-cta{display:none}
  body{font-size:12px}
  @page{margin:1.5cm;size:letter}
}
</style>
</head>
<body>

<div class="pdf-header">
  <div class="pdf-logo">
    <div class="pdf-logo-icon">CE</div>
    <div class="pdf-logo-text">CEQA Navigator</div>
  </div>
  <div class="pdf-meta">
    CEQA Pathway Report<br>
    Generated: ${dateStr}<br>
    2026 AEP Edition
  </div>
</div>

<div class="pdf-body">
  <div class="pdf-title">CEQA Pathway Determination</div>
  <div class="pdf-subtitle">2026 CEQA Statutes &amp; Guidelines — AEP Edition (PRC §§ 21000–21189 | 14 CCR §§ 15000–15387)</div>

  <div class="summary-bar">${summaryBar}</div>

  <div class="result-primary">${primaryRes}</div>

  <div class="result-conservative">
    <div class="result-con-header">
      <div style="display:flex;align-items:center">
        <div class="result-con-badge">Conservative option</div>
        <div>
          <div class="result-con-title">${conTitle}</div>
          <div class="result-con-abbr">${conAbbr}</div>
        </div>
      </div>
    </div>
    <div class="result-con-body">${conBody}</div>
  </div>

  <div class="compare-grid">
    <div class="result-card">${costRes}</div>
    <div class="result-card">${summTable}</div>
  </div>

  <div class="flow-container">
    <div class="flow-title">Recommended process steps</div>
    ${flowContent}
  </div>

  <div class="disclaimer-box">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c07030" stroke-width="2" style="flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    <div>
      <div class="disclaimer-title">Important Disclaimer</div>
      <div class="disclaimer-text">This tool provides general guidance only and does not replace review by a qualified CEQA professional, lead agency, or legal counsel. CEQA analysis is highly project-specific and fact-dependent. Results are a starting point for discussion — not a legal determination or certified environmental document. Always consult a licensed environmental professional and the applicable lead agency before making project decisions.</div>
    </div>
  </div>
  <div class="disclaimer-agency">⚠️ <strong>Agency review time disclaimer:</strong> Timelines reflect statutory minimums only. Actual processing time varies by jurisdiction and workload. Contact the lead agency early to understand current review backlogs.</div>

  <div class="print-cta">
    To save as PDF: use your browser's <strong>File → Print → Save as PDF</strong> option, or press <strong>Ctrl+P</strong> (Windows) / <strong>⌘+P</strong> (Mac).
  </div>
</div>

<div class="pdf-footer">
  <span>© 2026 CEQA Navigator — ceqanavigator.com — Not affiliated with the State of California, OPR, or AEP</span>
  <span>This report does not constitute legal advice</span>
</div>

</body>
</html>`;

  // Trigger download as .html file (works in all contexts including sandboxed iframes)
  const blob = new Blob([html], {type:'text/html;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'CEQA-Navigator-Report-' + new Date().toISOString().slice(0,10) + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════
// RESTART
// ═══════════════════════════════════════════════════════════
function restartTool(){
  Object.keys(answers).forEach(k=>delete answers[k]);
  Object.keys(multiAnswers).forEach(k=>delete multiAnswers[k]);
  deterResult=null;hasUnsavedProgress=false;
  document.querySelectorAll('.choice-btn,.check-btn').forEach(b=>b.classList.remove('selected'));
  document.querySelectorAll('[id$="-next"]').forEach(b=>{if(b.tagName==='BUTTON')b.disabled=true;});
  goToSection(0);
}

// ═══════════════════════════════════════════════════════════
// LABEL HELPERS
// ═══════════════════════════════════════════════════════════
function lType(v){return{residential:'Housing',residential_tod:'Transit-oriented housing (SB 79)',adaptive_reuse:'Office/commercial adaptive reuse (AB 507)',commercial:'Retail/office/hotel',industrial:'Industrial/warehouse/service yard',infrastructure:'Roads/utilities/infrastructure',institutional:'Public/civic facility',renovation:'Renovation/remodel/TI'}[v]||v;}
function lSize(v){return{small:'Small',medium:'Medium',large:'Large',major:'Very large/regional'}[v]||v;}
function lLoc(v){return{infill:'Already developed (urban/suburban)',suburban:'Partially developed',greenfield:'Undeveloped land',sensitive:'Near sensitive natural area'}[v]||v;}
function lApproval(v){return{ministerial:'Building/grading permit only',design:'Design review/minor use permit',cup:'CUP/variance/site plan',gpa:'GPA/rezoning/Specific Plan'}[v]||v;}
function lPrior(v){return{none:'No prior CEQA coverage',program:'General Plan or Program EIR',specific:'Specific Plan EIR or project-level EIR',prior_mnd:'Prior MND (years ago)',prior_is:'Prior Initial Study (incomplete)'}[v]||v;}
function lTimeline(v){return{flexible:'Legal protection priority',moderate:'Balanced',urgent:'Speed critical'}[v]||v;}
function eLabel(v){return{bio:'Creek/wetland/habitat',hazmat:'Contamination/hazmat database',cultural:'Historic/tribal resources',traffic:'VMT/vehicle trips',demolish:'Demolition',oldbuilding:'45+ yr old structure',grading:'Significant grading',trees:'Tree removal (5+)',piledriving:'Pile driving',nightwork:'After-hours construction',sensitive_receptor:'Homes/schools nearby',flood:'Flood zone',slopes:'Steep slopes',rail:'Near freeway/rail',federal:'Federal funding/permits',energy:'Energy use/renewables',wildfire:'Wildfire hazard zone',paleo:'Paleontological resources',airport:'Within 2 mi of airport',drivethrough:'Drive-through/idling vehicles',hcp:'Within HCP/NCCP area',none:'None'}[v]||v;}
function lEnvFull(){const s=multiAnswers.q5||new Set();if(s.has('none')||s.size===0)return'None identified';return[...s].filter(v=>v!=='none').map(eLabel).join(', ');}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// INFO MODALS (Disclaimer, Privacy, Terms, Contact, About)
// ═══════════════════════════════════════════════════════════
const INFO_PAGES={
  disclaimer:{
    title:'Disclaimer',
    body:`<p style="font-weight:600;color:var(--text);margin-bottom:.75rem">General Guidance Only</p>
<p>This tool provides general guidance only and does not replace review by a qualified CEQA professional, lead agency, or legal counsel. The results generated by CEQA Navigator are intended as a preliminary educational resource and starting point for discussion — not a legal determination, certified environmental document, or final agency decision.</p>
<p style="margin-top:.75rem">CEQA analysis is highly project-specific and fact-dependent. A change in a single project characteristic can materially alter the appropriate level of environmental review. Users are strongly encouraged to verify all pathway recommendations with a licensed environmental consultant and the applicable lead agency before taking any action.</p>
<p style="margin-top:.75rem">Statutory citations reflect the 2026 AEP Edition of the CEQA Statutes and Guidelines (Public Resources Code §§ 21000–21189; California Code of Regulations, Title 14, §§ 15000–15387), as amended through January 1, 2026. CEQA law is subject to change through legislation and judicial decisions. CEQA Navigator makes no representation that information is current after the date of publication.</p>
<p style="margin-top:.75rem">CEQA Navigator is not affiliated with the State of California, the Governor's Office of Planning and Research (OPR), the Department of Toxic Substances Control (DTSC), the State Water Resources Control Board (SWRCB), or the Association of Environmental Professionals (AEP).</p>
<p style="margin-top:.75rem;font-size:12px;padding:.75rem;background:var(--navy-light);border-radius:8px;color:var(--navy)"><strong>By using this tool, you acknowledge that you have read and understood this disclaimer.</strong></p>`
  },
  privacy:{
    title:'Privacy Policy',
    body:`<p style="font-weight:600;color:var(--text);margin-bottom:.75rem">Effective Date: January 1, 2026</p>
<p><strong>What we collect:</strong> CEQA Navigator collects only the information you voluntarily provide — your answers to the assessment questions. If you create a paid account, we collect your email address for login and receipt purposes.</p>
<p style="margin-top:.75rem"><strong>What we do not collect:</strong> We do not collect your name, address, phone number, or any personally identifiable information unless you explicitly provide it. We do not track your IP address for identification. Feedback submitted through the tool is anonymous by default.</p>
<p style="margin-top:.75rem"><strong>Payment data:</strong> Card numbers and payment details are processed exclusively by Stripe, Inc. (stripe.com), a PCI DSS Level 1 certified payment processor. CEQA Navigator never receives, stores, or has access to your full card number, CVV, or banking credentials. We receive only a transaction token and your email address from Stripe.</p>
<p style="margin-top:.75rem"><strong>Cookies and analytics:</strong> We may use minimal, privacy-respecting analytics (e.g., aggregate page views) to improve the tool. No third-party advertising trackers are used.</p>
<p style="margin-top:.75rem"><strong>Data sharing:</strong> We do not sell, rent, or share your personal information with any third party, except as required by law or as necessary to operate the service (e.g., payment processing via Stripe).</p>
<p style="margin-top:.75rem"><strong>Data retention:</strong> Account data is retained as long as your subscription is active. You may request deletion of your account and associated data at any time by contacting support@ceqanavigator.com.</p>
<p style="margin-top:.75rem"><strong>Contact:</strong> Questions about this policy may be directed to support@ceqanavigator.com.</p>`
  },
  terms:{
    title:'Terms of Use',
    body:`<p style="font-weight:600;color:var(--text);margin-bottom:.75rem">Effective Date: January 1, 2026</p>
<p><strong>Acceptance:</strong> By accessing or using CEQA Navigator, you agree to these Terms of Use. If you do not agree, do not use the tool.</p>
<p style="margin-top:.75rem"><strong>Permitted use:</strong> CEQA Navigator is provided for informational and educational purposes only. You may use this tool to generate preliminary CEQA pathway guidance for your projects. You may not redistribute, resell, scrape, or incorporate the tool's output into a commercial product without written permission.</p>
<p style="margin-top:.75rem"><strong>No legal advice:</strong> Nothing in this tool constitutes legal advice or creates an attorney-client relationship. Pathway determinations are general in nature and must be verified with qualified professionals before reliance.</p>
<p style="margin-top:.75rem"><strong>Subscriptions:</strong> Paid subscriptions are billed monthly or annually as selected. Subscriptions auto-renew unless cancelled before the renewal date. You may cancel at any time through your account settings or by contacting support@ceqanavigator.com.</p>
<p style="margin-top:.75rem"><strong>Intellectual property:</strong> The CEQA Navigator tool, interface, and underlying logic are proprietary. Statutory text quoted from the California Public Resources Code and CCR Title 14 is in the public domain.</p>
<p style="margin-top:.75rem"><strong>Limitation of liability:</strong> CEQA Navigator is provided "as is" without warranty of any kind. We are not liable for any project decisions made in reliance on tool output, or for any legal, financial, or environmental consequences arising from use of this tool.</p>
<p style="margin-top:.75rem"><strong>Governing law:</strong> These Terms are governed by the laws of the State of California. Any disputes shall be resolved in California courts.</p>`
  },
  refund:{
    title:'Refund Policy',
    body:`<p><strong>Monthly subscriptions:</strong> You may cancel at any time. Cancellation takes effect at the end of the current billing period. No prorated refunds are issued for partial months.</p>
<p style="margin-top:.75rem"><strong>Annual subscriptions:</strong> If you cancel within 14 days of your annual subscription start date and have not downloaded more than 3 PDF reports, you are eligible for a full refund. After 14 days, no refunds are issued for the remainder of the annual term.</p>
<p style="margin-top:.75rem"><strong>Technical issues:</strong> If a verified technical error prevented you from accessing the service, contact support@ceqanavigator.com within 30 days and we will issue a pro-rated credit or refund at our discretion.</p>
<p style="margin-top:.75rem"><strong>How to request:</strong> Email support@ceqanavigator.com with your account email and reason for the refund request. Eligible refunds are processed within 5–10 business days to your original payment method.</p>`
  },
  contact:{
    title:'Contact Us',
    body:`<div style="display:grid;gap:1rem">
<div style="background:var(--navy-light);border-radius:10px;padding:1rem 1.25rem">
  <div style="font-size:12px;font-weight:600;color:var(--navy);margin-bottom:.5rem">General support &amp; questions</div>
  <a href="mailto:support@ceqanavigator.com" style="font-size:14px;color:var(--navy-mid);font-weight:500">support@ceqanavigator.com</a>
  <div style="font-size:12px;color:var(--text-muted);margin-top:.25rem">We respond within 1–2 business days.</div>
</div>
<div style="background:var(--green-light);border-radius:10px;padding:1rem 1.25rem">
  <div style="font-size:12px;font-weight:600;color:var(--green);margin-bottom:.5rem">Feedback &amp; feature requests</div>
  <div style="font-size:13px;color:var(--text-muted)">Use the Feedback button in the top navigation bar to submit anonymous feedback — no login required. We read every submission.</div>
</div>
<div style="background:var(--amber-light);border-radius:10px;padding:1rem 1.25rem">
  <div style="font-size:12px;font-weight:600;color:var(--amber);margin-bottom:.5rem">Subscription &amp; billing</div>
  <div style="font-size:13px;color:var(--text-muted)">For subscription changes, cancellations, or refund requests, email support@ceqanavigator.com with your account email address.</div>
</div>
<div style="background:#f5f5f0;border-radius:10px;padding:1rem 1.25rem;border:1px solid var(--border)">
  <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:.5rem">Support the developer</div>
  <div style="font-size:13px;color:var(--text-muted);margin-bottom:.5rem">This tool is independently developed and maintained. If you find it useful, consider buying the developer a coffee.</div>

</div>
</div>`
  },
  about:{
    title:'About CEQA Navigator',
    body:`<p>CEQA Navigator is an independent, plain-language tool designed to help California planners, environmental consultants, public agencies, developers, and community members navigate the California Environmental Quality Act (CEQA) review process.</p>
<p style="margin-top:.75rem"><strong>Why it was built:</strong> CEQA is one of California's most important but most difficult environmental laws to navigate. The correct review pathway — from a simple categorical exemption to a full Environmental Impact Report — depends on dozens of overlapping factors. Getting it wrong can expose projects to costly legal challenges or years of unnecessary delay. CEQA Navigator distills the most common decision logic into a clear, step-by-step assessment anyone can complete in under 5 minutes.</p>
<p style="margin-top:.75rem"><strong>Data sources:</strong> All guidance is based on the 2026 CEQA Statutes &amp; Guidelines (AEP Edition), published by the Association of Environmental Professionals — the authoritative annual compilation of California's CEQA statutes and guidelines, updated through January 1, 2026. This includes the full text of PRC §§ 21000–21189 and 14 CCR §§ 15000–15387, as well as 2025 legislative updates (SB 79, AB 507, AB 130, SB 131, SB 71) and relevant 2025 case law (Koi Nation ruling).</p>
<p style="margin-top:.75rem"><strong>Limitations:</strong> This tool is a starting point, not a legal determination. CEQA is highly fact-specific; a qualified CEQA practitioner and the applicable lead agency must always make the final determination. Results should be treated as preliminary guidance to inform project planning conversations.</p>
<p style="margin-top:.75rem"><strong>Independence:</strong> CEQA Navigator is not affiliated with the State of California, the Governor's Office of Planning and Research (OPR), the Department of Toxic Substances Control (DTSC), or the Association of Environmental Professionals (AEP).</p>`
  },
  how:{
    title:'How This Tool Works',
    body:`<p>CEQA Navigator guides you through <strong>9 plain-language questions</strong> about your project and applies a built-in decision tree based on 2026 CEQA law to identify the most appropriate review pathway.</p>
<div style="margin-top:1rem;display:flex;flex-direction:column;gap:.6rem">
  <div style="display:flex;gap:10px;align-items:flex-start"><div style="width:22px;height:22px;background:var(--navy);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">1</div><div><strong>Applicant type</strong> — Public agency vs. private applicant: different time limits, fees, and CEQA responsibilities apply.</div></div>
  <div style="display:flex;gap:10px;align-items:flex-start"><div style="width:22px;height:22px;background:var(--navy);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">2</div><div><strong>Project type</strong> — Includes 2025 categories like transit-oriented housing (SB 79) and adaptive reuse (AB 507) that may qualify for new statutory exemptions.</div></div>
  <div style="display:flex;gap:10px;align-items:flex-start"><div style="width:22px;height:22px;background:var(--navy);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">3–5</div><div><strong>Size, site, and approvals</strong> — Project scale and the type of discretionary approval determine whether ministerial exemptions, categorical exemptions, or formal CEQA documents apply.</div></div>
  <div style="display:flex;gap:10px;align-items:flex-start"><div style="width:22px;height:22px;background:var(--navy);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">6</div><div><strong>Environmental features</strong> — A multi-select checklist covering demolition, contamination (Cortese List), biological resources, tribal resources, and VMT. Checking multiple items escalates the recommended pathway.</div></div>
  <div style="display:flex;gap:10px;align-items:flex-start"><div style="width:22px;height:22px;background:var(--navy);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">7</div><div><strong>Land ownership</strong> — Whether the project requires land acquisition affects CEQA scope under §15064(h) and potentially the Surplus Lands Act and Uniform Relocation Act.</div></div>
  <div style="display:flex;gap:10px;align-items:flex-start"><div style="width:22px;height:22px;background:var(--navy);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">8–9</div><div><strong>Prior CEQA &amp; risk tolerance</strong> — Existing CEQA documents (MNDs, Program EIRs) may enable faster tiering. Risk preference (legal protection vs. speed) calibrates whether to recommend the standard or conservative pathway.</div></div>
</div>
<p style="margin-top:1rem">The tool outputs: a <strong>recommended pathway</strong>, a <strong>conservative alternative</strong> (expandable), a <strong>cost breakdown</strong>, a <strong>step-by-step flowchart</strong> with statutory timelines, and a <strong>downloadable PDF</strong>.</p>`
  }
};

function openInfoModal(key){
  const page=INFO_PAGES[key];
  if(!page)return;
  document.getElementById('info-modal-title').textContent=page.title;
  document.getElementById('info-modal-body').innerHTML=page.body;
  document.getElementById('info-modal').style.display='flex';
}
function closeInfoModal(){
  document.getElementById('info-modal').style.display='none';
}

renderProgress();