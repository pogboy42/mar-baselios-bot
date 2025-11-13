let KB = null;
const chatBody = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const quickActions = document.getElementById('quick-actions');

let context = { lastIntent: null, lastEntity: null };

fetch('knowledgeBase.json')
  .then(r => r.json())
  .then(json => { KB = json; })
  .catch(err => {
    appendBotMessage('I could not load the knowledge base. Please ensure knowledgeBase.json is available.');
  });

function appendBotMessage(text, opts = {}){
  const div = document.createElement('div');
  div.className = 'bot-message message-row';
  // message
  const msg = document.createElement('div');
  msg.innerText = text;
  div.appendChild(msg);

  // suggestions (quick replies)
  if(Array.isArray(opts.suggestions) && opts.suggestions.length){
    const wrap = document.createElement('div');
    wrap.className = 'reply-buttons';
    opts.suggestions.slice(0,5).forEach(s => {
      const b = document.createElement('button');
      b.className = 'reply-btn';
      b.innerText = s;
      b.addEventListener('click', ()=>{
        userInput.value = s;
        sendBtn.click();
      });
      wrap.appendChild(b);
    });
    div.appendChild(wrap);
  }

  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function appendUserMessage(text){
  const div = document.createElement('div');
  div.className = 'user-message message-row';
  div.innerHTML = `<div>${text}</div>`;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function showTypingIndicator(){
  const t = document.createElement('div');
  t.className = 'bot-message';
  t.id = 'typing';
  t.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  chatBody.appendChild(t);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function hideTypingIndicator(){
  const t = document.getElementById('typing');
  if(t) t.remove();
}

function answerFromKB(input){
  if(!KB) return "I'm sorry, I can't access the knowledge base right now.";
  const q = (input || '').toLowerCase();

  // helper getters to tolerate different KB shapes
  const getSchoolName = () => KB.school?.name || KB.about?.name || (KB.about?.overview ? KB.about.overview.split('.')[0] : null) || 'Mar Baselios Public School';
  const getPrincipal = () => KB.about?.management?.principal || KB.school?.principal || (KB.faculty && KB.faculty.find(f=>/principal/i.test(f.designation))?.name) || 'the principal';
  const getVicePrincipal = () => KB.about?.management?.vice_principal || KB.school?.vice_principal || (KB.faculty && KB.faculty.find(f=>/vice principal|vice-principal/i.test(f.designation))?.name) || 'the vice principal';
  const normalizeEvents = () => {
    if(!KB.events) return [];
    if(Array.isArray(KB.events)) return KB.events.map(e=>({name:e.name||e.title||'', description:e.description||e.desc||''}));
    if(typeof KB.events === 'object') return Object.entries(KB.events).map(([k,v])=>({name: (k.replace(/_/g,' ')||k), description: v}));
    return [];
  };
  const getCoCurricular = () => KB.co_curricular || KB.academics?.co_curricular || KB.academics?.['co-curricular'] || [];
  const getHouses = () => KB.houses || [];
  const getStudentCouncilMembers = () => {
    if(Array.isArray(KB.student_council?.members)) return KB.student_council.members;
    const sc = KB.student_council || {};
    const members = [];
    if(sc.president) members.push({name: sc.president, position: 'President'});
    if(sc.vice_president) members.push({name: sc.vice_president, position: 'Vice President'});
    if(sc.head_boy) members.push({name: sc.head_boy, position: 'Head Boy'});
    if(sc.head_girl) members.push({name: sc.head_girl, position: 'Head Girl'});
    if(sc.sports_captain) members.push({name: sc.sports_captain, position: 'Sports Captain'});
    if(sc.secretary) members.push({name: sc.secretary, position: 'Secretary'});
    return members;
  };
  const getFacultyList = () => KB.faculty || [];

  // Direct keyword matches (robust)
  if(q.includes('principal')){
    return `The principal of ${getSchoolName()} is ${getPrincipal()}.`;
  }

  if(q.includes('vice principal')||q.includes('vice-principal')){
    return `The vice principal is ${getVicePrincipal()}.`;
  }

  if(q.includes('computer lab')||q.includes('computerlab')||q.includes('computer lab.')){
    return KB.infrastructure?.labs?.computer_lab || 'The school has a computer lab with modern workstations and internet.';
  }

  if(q.includes('science lab')) return KB.infrastructure?.labs?.science_lab || 'The school has science labs equipped for Physics, Chemistry and Biology.';
  if(q.includes('math lab')||q.includes('mathematics lab')) return KB.infrastructure?.labs?.math_lab || 'The school has a Mathematics Lab with interactive aids.';

  if(q.includes('co-curricular')||q.includes('co curricular')||q.includes('co curricular activities')||q.includes('co-curricular activities')){
    const cc = getCoCurricular();
    return cc.length ? `We offer the following co-curricular activities: ${cc.join(', ')}.` : 'Co-curricular activities are available; please check the activities section in the school brochure.';
  }

  if(q.includes('apply for class xi')||q.includes('apply for xi')||q.includes('class xi')||q.includes('class 11')||q.includes('class xi admissions')){
    return KB.admissions?.class_xi_apply || KB.admissions?.procedure || 'To apply for Class XI, please follow the admissions procedure listed on the school website or contact the office.';
  }

  if(q.includes('student council')||q.includes('student council members')||q.includes('council members')){
    const members = getStudentCouncilMembers();
    if(members.length) return `The current student council members are: ${members.map(m=>`${m.name} (${m.position})`).join(', ')}.`;
    const sc = KB.student_council || {};
    return `Student council: ${Object.entries(sc).map(([k,v])=>`${k.replace(/_/g,' ')}: ${v}`).join('; ')}.`;
  }

  if(q.includes('head boy')){
    return `The head boy is ${KB.student_council?.head_boy || (getStudentCouncilMembers().find(m=>/head boy/i.test(m.position))?.name) || 'not listed'}.`;
  }

  if(q.includes('head girl')){
    return `The head girl is ${KB.student_council?.head_girl || (getStudentCouncilMembers().find(m=>/head girl/i.test(m.position))?.name) || 'not listed'}.`;
  }

  if(q.includes('houses')||q.includes('house')){
    context.lastIntent = 'houses';
    const names = getHouses().map(h=>h.name).join(', ');
    return names ? `We have the following houses: ${names}. Would you like to know the captains of each house?` : 'House information is not available in the knowledge base.';
  }

  if((q === 'yes' || q.includes('captain')) && context.lastIntent === 'houses'){
    const caps = getHouses().map(h=>`${h.name}: ${h.captain || h.leader || 'not listed'}`).join('; ');
    context.lastIntent = null;
    return caps ? `House captains are: ${caps}.` : 'House captains are not listed in the knowledge base.';
  }

  // senior secondary science optional (tolerant to structure)
  if(q.includes('science optional')||q.includes('science optional subjects')){
    const opts = KB.senior_secondary?.streams?.science?.optional || KB.academics?.science_optional || [];
    return opts.length ? `Science optional subjects include: ${opts.join(', ')}.` : 'Science optional subject information is not available.';
  }

  if(q.includes('events')||q.includes('school events')||q.includes('what are the school events')){
    const events = normalizeEvents();
    if(events.length) return `Here are the key school events:\n${events.map(e=>`${e.name} — ${e.description}`).join('\n')}`;
    return 'Event information is not available in the knowledge base.';
  }

  if(q.includes('contact')||q.includes('phone')||q.includes('email')||q.includes('address')||q.includes('contact details')){
    const c = KB.contact || {};
    return `You can contact ${getSchoolName()} at ${c.phone || 'phone not listed'} or email ${c.email || 'email not listed'}. The school address is ${c.address || 'address not listed'}.`;
  }

  // Faculty queries: by name or subject (tolerant)
  if(q.includes('teacher')||q.includes('faculty')||q.includes('staff')||q.includes('who is')||q.includes('contact of')||q.includes('email')){
    // Try find name or subject
    for(const f of getFacultyList()){
      const fname = (f.name || '').toLowerCase();
      const fsubject = (f.subject || f.classes_handled || '').toLowerCase();
      if(q.includes(fname) || (fsubject && q.includes(fsubject))) {
        const contact = f.contact || f.email || 'contact not listed';
        const exp = f.experience_years || f.experience || 'experience not listed';
        const subject = f.subject || (f.designation && /teacher/i.test(f.designation) ? f.designation.replace(/teacher/i,'').trim() : f.classes_handled || 'subject not listed');
        return `${f.name} is ${f.designation || 'a staff member'}, ${subject ? `teaches ${subject},` : ''} with ${exp} of experience. Contact: ${contact}.`;
      }
    }
  }

  // Quick menu keywords
  if(q.includes('faculty details')){
    const list = getFacultyList().map(f=>`${f.name} — ${f.designation}${f.subject ? ` (${f.subject})` : ''}`).join('; ');
    return list ? `Our faculty includes: ${list}. If you want contact details for a particular teacher, ask for their name or subject.` : 'No faculty information available.';
  }

  if(q.includes('facilities')){
    return `Our facilities include: ${KB.infrastructure?.library ? 'library, ' : ''}${KB.infrastructure?.labs ? 'labs, ' : ''}${KB.infrastructure?.transport ? 'transport, ' : ''}${KB.infrastructure?.canteen ? 'canteen' : ''}` || 'Facility information is limited.';
  }

  if(q.includes('admissions')){
    return `Admissions: ${KB.admissions?.procedure || KB.admissions?.criteria || 'details not listed'}. Required documents: ${(KB.admissions?.documents_required || KB.admissions?.documents || []).join(', ') || 'not listed'}.`;
  }

  // If user asks for quick FAQ-like suggestions
  if(q.length < 40 && (q.includes('help')||q.includes('options')||q.includes('menu')||q.includes('suggest'))) {
    return 'You can ask about teachers, events, admissions, facilities, houses, student council, or contact details.';
  }

  // Try fuzzy lookup: check keys and values
  const jsonText = JSON.stringify(KB || {}).toLowerCase();
  const events = normalizeEvents();
  for(const ev of events){
    if(q.includes((ev.name || '').toLowerCase())) return `${ev.name}: ${ev.description}`;
  }

  // Not found fallback
  return "I'm sorry, I don't have information on that. try contacting the school directly for more details.";
}

// Small formatter to make answers friendlier and produce follow-ups
function formatBotResponse(rawAnswer, userQuery){
  const q = (userQuery || '').toLowerCase();
  let prefix = '';
  let suggestions = [];

  // friendly prefixes based on query
  if(q.includes('principal') || rawAnswer.toLowerCase().includes('principal')){
    prefix = 'Certainly — ';
    suggestions = ['Contact details', 'School address', 'Vice principal'];
  } else if(q.includes('events') || rawAnswer.toLowerCase().includes('annual') || rawAnswer.toLowerCase().includes('sports')){
    prefix = 'Here are the details: ';
    suggestions = ['Upcoming events', 'Event calendar', 'How to participate'];
  } else if(q.includes('admission') || q.includes('apply') || rawAnswer.toLowerCase().includes('admission')){
    prefix = 'Happy to help with admissions. ';
    suggestions = ['Admission process', 'Required documents', 'Fees'];
  } else if(q.includes('faculty') || q.includes('teacher')){
    prefix = 'Sure — here is what I found: ';
    suggestions = ['Faculty contact', 'Departments', 'More teachers'];
  } else if(q.includes('house') || rawAnswer.toLowerCase().includes('house')){
    prefix = 'Our houses encourage team spirit. ';
    // suggest captains if available
    const houses = KB.houses || [];
    if(houses.length) suggestions = houses.map(h=>h.name).slice(0,4);
  } else {
    prefix = '';
    suggestions = ['Faculty Details','Events','Admissions','Facilities'];
  }

  // ensure full sentence ending
  let text = rawAnswer;
  if(!/\.$/.test(text.trim())) text = text.trim() + '.';

  return { text: prefix + text, suggestions };
}

function processUserMessage(msg){
  appendUserMessage(msg);
  showTypingIndicator();
  setTimeout(()=>{
    hideTypingIndicator();
    const raw = answerFromKB(msg);
    const formatted = formatBotResponse(raw, msg);
    appendBotMessage(formatted.text, { suggestions: formatted.suggestions });
  }, 700 + Math.min(1200, msg.length*10));
}

sendBtn.addEventListener('click', ()=>{
  const text = userInput.value.trim();
  if(!text) return;
  userInput.value = '';
  processUserMessage(text);
});

userInput.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') sendBtn.click();
});

document.querySelectorAll('.quick-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    const q = b.dataset.q;
    userInput.value = q;
    sendBtn.click();
  });
});

// Expose a simple function for embedding sites to ask programmatically
window.luminaAsk = function(question){
  processUserMessage(question);
}