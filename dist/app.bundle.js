(()=>{
  'use strict';
  // THE API KEY I HAVE USED, WILL BE DELETED ONCE DEMOMED SITE GOES OFFLINE. BETTER DON'T ATTEMPT TAMPERING!
  const OPENROUTER_URL='https://openrouter.ai/api/v1/chat/completions';
  const __k1='c2stb3ItdjEtNTQ3MmE0YWVmYTUyN2M4NTNhYWU5Nzk0NDc0MTZkYmZhZTg3ZjRlNjE5NWYyYjdkODk3NWYxNDVkN2I4MDkwZQ==';
  const OPENROUTER_KEY=(typeof atob==='function'?atob(__k1):Buffer.from(__k1,'base64').toString('utf8'));
  const SITE_URL='https://demomed.local';
  const SITE_TITLE='DemoMed AI';
  const WEATHER_URL='https://api.open-meteo.com/v1/forecast?latitude=23.3441&longitude=85.3096&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=Asia/Kolkata';
  const WEATHER_REFRESH_INTERVAL=9e5;
  const STORAGE_KEY='demomedai_messages';
  const NOTICE_KEY='demomedai_notice_shown';
  const USER_NAME_KEY='demomedai_userName';
  const ERROR_MESSAGE='OUR SYSTEMS ARE FACING TECHNICAL PROBLEMS. KINDLY, CONTACT PRATYUSH TO RESOLVE THIS AS SOON AS POSSIBLE!';
  const SANITIZE_TOKEN=/<\uFF5Cb\u0065gin▁of▁sentence\uFF5C>|<\|begin_of_sentence\|>/g;
  const APP_GREETING_VARIANTS=[
    'Hello! Welcome to DemoMed AI, created by a specific group of Pratyush, Prabhakar, and Abhiraj as a school (LKCRMS) practical project for Batch 2025-26.',
    'Hi there! This is DemoMed AI, built by Pratyush, Prabhakar, and Abhiraj for LKCRMS Batch 2025-26.',
    'Hey! You\'re chatting with DemoMed AI - a LKCRMS Batch 2025-26 project by Pratyush, Prabhakar, and Abhiraj.'
  ];
  const APP_NAME_VARIANTS=[
    'I go by DemoMed AI - your medical helper.',
    'You can call me DemoMed AI, a classroom-built assistant.',
    'DemoMed AI here - focused on medical queries.'
  ];
  const APP_CREATOR_VARIANTS=[
    'I was made by Pratyush, the developer and maintainer of this site, along with Abhiraj and Prabhakar as teammates who helped with expenses like the domain and other project needs.',
    'Pratyush built and maintains me; Abhiraj and Prabhakar teamed up handling project and domain expenses.',
    'Created by Pratyush (dev and maintainer) with teammates Abhiraj and Prabhakar supporting costs like the domain and other needs.'
  ];
  const NON_MEDICAL_RESPONSE='I am made specifically for medical related topics. Kindly ask questions about medicine, medical problems, health, or even the history of medicine and related fields. Please avoid questions from other areas, as I am not optimized for them right now.';
  const WEATHER_CODES={0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Icy fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Freezing drizzle',57:'Heavy freezing drizzle',61:'Light rain',63:'Rain showers',65:'Heavy rain',66:'Freezing rain',67:'Heavy freezing rain',71:'Light snow',73:'Snowfall',75:'Heavy snow',77:'Snow grains',80:'Light showers',81:'Showers',82:'Heavy showers',85:'Snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Storm with hail',99:'Severe storm'};
  const SKIP_KEY='demomedai_skip_intro';
  const START_DESTINATION='index.html';
  const pickVariant=list=>list[Math.floor(Math.random()*list.length)];
  const sanitizeStreamText=text=>(text||'').replace(SANITIZE_TOKEN,'');
  function initAppPage(){
    const chatArea=document.getElementById('chatArea');
    const userInput=document.getElementById('userInput');
    const noticeBanner=document.getElementById('noticeBanner');
    const noticeCloseBtn=document.getElementById('noticeCloseBtn');
    const weatherElements={
      card:document.getElementById('weatherCard'),
      temp:document.getElementById('weatherTemp'),
      desc:document.getElementById('weatherDesc'),
      humidity:document.getElementById('weatherHumidity'),
      wind:document.getElementById('weatherWind'),
      updated:document.getElementById('weatherUpdated')
    };
    let noticeAutoHideHandle=null;
    let weatherRefreshHandle=null;
    let isProcessing=false;
    let isRequesting=false;
    const setText=(element,value)=>{if(element){element.textContent=value;}};
    const renderToHtml=markdown=>{try{const parsed=window.marked?window.marked.parse(markdown||''):markdown||'';const wrapper=document.createElement('div');wrapper.innerHTML=parsed;if(window.renderMathInElement){window.renderMathInElement(wrapper,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]});}return wrapper.innerHTML;}catch(error){return markdown||'';}};
    const handleNotice=()=>{if(!noticeBanner){return;}if(noticeAutoHideHandle){clearTimeout(noticeAutoHideHandle);noticeAutoHideHandle=null;}if(localStorage.getItem(NOTICE_KEY)){noticeBanner.classList.add('hidden');return;}noticeBanner.classList.remove('hidden');noticeAutoHideHandle=setTimeout(()=>{noticeBanner.classList.add('hidden');localStorage.setItem(NOTICE_KEY,'true');noticeAutoHideHandle=null;},1e4);};
    const setWeatherLoading=loading=>{if(weatherElements.card){weatherElements.card.classList.toggle('loading',Boolean(loading));}};
    const formatWeatherUpdated=time=>{if(!time){return'Updated just now';}const parsed=new Date(time);if(Number.isNaN(parsed.getTime())){return'Updated just now';}return`Updated at ${parsed.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'})}`;};
    const describeWeather=code=>WEATHER_CODES[code]||'Current conditions';
    const showWeatherError=message=>{if(!weatherElements.card){return;}weatherElements.card.classList.add('error');weatherElements.card.title=message||'Weather data unavailable';setText(weatherElements.temp,'--°C');setText(weatherElements.desc,'Weather unavailable');setText(weatherElements.updated,'Retrying shortly');setText(weatherElements.humidity,'--% humidity');setText(weatherElements.wind,'Check connection');};
    const saveMessages=()=>{const messages=[];document.querySelectorAll('.message').forEach(message=>{const content=message.querySelector('.message-content');if(content){messages.push({type:message.classList.contains('user')?'user':'bot',content:content.innerHTML});}});localStorage.setItem(STORAGE_KEY,JSON.stringify(messages));};
    const addMessage=(html,sender,save=true)=>{const wrapper=document.createElement('div');wrapper.className=`message ${sender}`;const src=sender==='bot'?'logo.png':'user-avatar.png';const alt=sender==='bot'?'DemoMed AI':'User';const overlay=sender==='bot'?'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a3 3 0 013 3v1h2a2 2 0 012 2v3a6 6 0 01-6 6h-2a6 6 0 01-6-6V8a2 2 0 012-2h2V5a3 3 0 013-3z" stroke="currentColor" stroke-width="1.5" opacity="0.6"/></svg>':'';wrapper.innerHTML=`<div class="message-avatar">${overlay}<img src="${src}" alt="${alt}" onerror="this.style.display='none'"></div><div class="message-content">${html}</div>`;chatArea.appendChild(wrapper);chatArea.scrollTop=chatArea.scrollHeight;if(save){saveMessages();}return wrapper;};
    const showTyping=()=>{const typing=document.createElement('div');typing.className='message bot';typing.id='typing';typing.innerHTML='<div class="message-avatar"><img src="logo.png" alt="DemoMed AI" onerror="this.style.display=\'none\'"></div><div class="message-content"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';chatArea.appendChild(typing);chatArea.scrollTop=chatArea.scrollHeight;};
    const removeTyping=()=>{const typing=document.getElementById('typing');if(typing){typing.remove();}};
    const showTempLabel=(id,text)=>{removeTempLabel(id);const label=document.createElement('div');label.className='temp-label';label.dataset.id=id;label.textContent=text;label.style.margin='6px 28px';label.style.color='#64748b';label.style.fontSize='12px';label.style.fontWeight='700';chatArea.appendChild(label);chatArea.scrollTop=chatArea.scrollHeight;};
    const removeTempLabel=id=>{document.querySelectorAll('.temp-label').forEach(label=>{if(label.dataset.id===id){label.remove();}});};
    const isBigOrMultiQuestion=text=>{if(!text){return false;}const questionMarks=(text.match(/\?/g)||[]).length;const sentences=text.split(/[.!?]\s+/).filter(Boolean).length;return text.length>220||questionMarks>=2||sentences>=3;};
    const interceptResponse=text=>{const lower=(text||'').toLowerCase();const greetingPattern=/(hi|hello|hey|hola|namaste|yo)\b/;const namePattern=/(what('| i)?s your name|who are you|ur name|your name|name\??)/;const creatorPattern=/(who (made|built|created) (you|this)|creator|developer|owner)/;if(namePattern.test(lower)){return pickVariant(APP_NAME_VARIANTS);}if(greetingPattern.test(lower)){return pickVariant(APP_GREETING_VARIANTS);}if(creatorPattern.test(lower)){return pickVariant(APP_CREATOR_VARIANTS);}return null;};
    const isOutOfScope=text=>{const lower=(text||'').toLowerCase();const nonMedicalHints=['code','coding','javascript','react','python','bug','debug','compile','algorithm','leetcode','program'];const medicalHints=['health','medicine','medical','symptom','disease','doctor','drug','diagnos','treatment','history of medicine','anatomy','physiology','pathology'];const hasNonMedical=nonMedicalHints.some(hint=>lower.includes(hint));const hasMedical=medicalHints.some(hint=>lower.includes(hint));return hasNonMedical&&!hasMedical;};
    const handleWeather=async()=>{clearTimeout(weatherRefreshHandle);setWeatherLoading(true);try{const response=await fetch(WEATHER_URL);if(!response.ok){throw new Error(`Weather API error (${response.status})`);}const data=await response.json();const current=data&&data.current;if(!current){throw new Error('No weather data returned');}const temperature=current.temperature_2m;const humidity=current.relative_humidity_2m;const windSpeed=current.wind_speed_10m;const condition=describeWeather(current.weather_code);if(weatherElements.card){weatherElements.card.classList.remove('error');weatherElements.card.title='';}setText(weatherElements.temp,Number.isFinite(temperature)?`${Math.round(temperature)}°C`:'--°C');setText(weatherElements.desc,condition);setText(weatherElements.updated,formatWeatherUpdated(current.time));setText(weatherElements.humidity,Number.isFinite(humidity)?`${Math.round(humidity)}% humidity`:'--% humidity');setText(weatherElements.wind,Number.isFinite(windSpeed)?`${Math.round(windSpeed)} km/h wind`:'-- km/h wind');}catch(error){showWeatherError(error.message||'Unable to load weather');}finally{setWeatherLoading(false);weatherRefreshHandle=setTimeout(handleWeather,WEATHER_REFRESH_INTERVAL);}};
    const showWelcome=()=>{chatArea.innerHTML='<div class="welcome-message"><div class="welcome-icon-container"><img src="logo.png" alt="DemoMed AI"></div><div class="welcome-title">Welcome to DemoMed AI</div><div class="welcome-text">DemoMed AI is a medical assistant prototype created by Class 10 students from LKCRMS.</div><div class="quick-actions"><button class="quick-action-btn" onclick="insertQuery(\'Why I am feeling sick?\')">Why I\'m feeling sick?</button><button class="quick-action-btn" onclick="insertQuery(\'Benefits of eating apple\')">Benefits of eating apple</button><button class="quick-action-btn" onclick="insertQuery(\'How to prevent dandruff?\')">How to prevent dandruff?</button></div></div>';};
    const loadMessages=()=>{const stored=localStorage.getItem(STORAGE_KEY);if(!stored){showWelcome();return;}let messages=null;try{messages=JSON.parse(stored);}catch(error){console.warn('Clearing corrupt conversation history',error);localStorage.removeItem(STORAGE_KEY);showWelcome();return;}if(!Array.isArray(messages)||messages.length===0){showWelcome();return;}messages.forEach(message=>{if(!message||(message.type!=='user'&&message.type!=='bot')){return;}const safeContent=typeof message.content==='string'?message.content:'';addMessage(safeContent,message.type,false);});};
    const showTempHints=message=>{if(isBigOrMultiQuestion(message)){showTempLabel('big-hint','You\'ve asked multiple or big questions at once, so the responses might take some time to load.');}};
    const streamMessageFromAPI=async(userMessage,messageElement)=>{
      const contentElement=messageElement&&messageElement.querySelector('.message-content');
      if(!contentElement){return;}
      if(isRequesting){return;}
      isRequesting=true;
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),15e3);
      try{
        const response=await fetch(OPENROUTER_URL,{
          method:'POST',
          headers:{
            Authorization:`Bearer ${OPENROUTER_KEY}`,
            'HTTP-Referer':SITE_URL,
            'X-Title':SITE_TITLE,
            'Content-Type':'application/json',
            Accept:'text/event-stream'
          },
          body:JSON.stringify({
            model:'deepseek/deepseek-chat-v3.1:free',
            stream:true,
            messages:[{role:'user',content:userMessage}]
          }),
          signal:controller.signal,
          keepalive:true
        });
        clearTimeout(timeout);
        if(!response.ok){
          const text=await response.text().catch(()=>'');
          throw new Error(text||response.statusText);
        }
        removeTyping();
        let accumulated='';
        let stallTimer=setTimeout(()=>showTempLabel('stall','GENERATING......'),2500);
        const reader=response.body.getReader();
        const decoder=new TextDecoder();
        let clearedBigHint=false;
        while(true){
          const {done,value}=await reader.read();
          if(done){break;}
          const chunk=decoder.decode(value,{stream:true});
          const lines=chunk.split('\n').map(line=>line.trim()).filter(Boolean);
          for(const line of lines){
            if(!line.startsWith('data:')){continue;}
            const data=line.replace(/^data:\s*/,'');
            if(data==='[DONE]'){continue;}
            try{
              const json=JSON.parse(data);
              const delta=json&&json.choices&&json.choices[0]&&json.choices[0].delta&&json.choices[0].delta.content;
              if(delta){
                accumulated+=sanitizeStreamText(delta);
                contentElement.innerHTML=renderToHtml(accumulated);
                chatArea.scrollTop=chatArea.scrollHeight;
                removeTempLabel('stall');
                clearTimeout(stallTimer);
                stallTimer=setTimeout(()=>showTempLabel('stall','GENERATING......'),3e3);
                if(!clearedBigHint){
                  removeTempLabel('big-hint');
                  clearedBigHint=true;
                }
              }
            }catch(error){continue;}
          }
        }
        removeTempLabel('stall');
        removeTempLabel('big-hint');
        saveMessages();
      }catch(error){
        removeTempLabel('stall');
        removeTempLabel('big-hint');
        throw error;
      }finally{
        clearTimeout(timeout);
        setTimeout(()=>{isRequesting=false;},1500);
      }
    };
    const sendMessage=async()=>{
      if(isProcessing){return;}
      const message=(userInput.value||'').trim();
      if(!message){return;}
      const intercepted=interceptResponse(message);
      if(intercepted){
        addMessage(renderToHtml(intercepted),'bot');
        userInput.value='';
        return;
      }
      if(isOutOfScope(message)){
        addMessage(NON_MEDICAL_RESPONSE,'bot');
        userInput.value='';
        return;
      }
      isProcessing=true;
      userInput.disabled=true;
      const sendButton=document.getElementById('sendBtn');
      if(sendButton){sendButton.disabled=true;}
      const welcome=document.querySelector('.welcome-message');
      if(welcome){welcome.remove();}
      addMessage(message,'user');
      userInput.value='';
      userInput.style.height='auto';
      showTyping();
      showTempHints(message);
      try{
        const placeholder=addMessage('','bot');
        await streamMessageFromAPI(message,placeholder);
      }catch(error){
        removeTyping();
        addMessage(ERROR_MESSAGE,'bot');
      }finally{
        removeTempLabel('stall');
        removeTempLabel('big-hint');
        isProcessing=false;
        userInput.disabled=false;
        const sendButtonFinal=document.getElementById('sendBtn');
        if(sendButtonFinal){sendButtonFinal.disabled=false;}
      }
    };
    const insertQuery=text=>{userInput.value=text;userInput.focus();userInput.dispatchEvent(new Event('input'));};
    const showAbout=()=>openModal('aboutModal');
    const showDisclaimer=()=>openModal('disclaimerModal');
    const showResetConfirm=()=>openModal('resetModal');
    const openModal=id=>{const modal=document.getElementById(id);if(modal){modal.classList.add('active');}};
    const closeModal=id=>{const modal=document.getElementById(id);if(modal){modal.classList.remove('active');}};
    const confirmReset=()=>{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(NOTICE_KEY);closeModal('resetModal');chatArea.innerHTML='';showWelcome();};
    const displayUserName=()=>{const userName=(localStorage.getItem(USER_NAME_KEY)||'').trim();const badge=document.getElementById('userNameBadge');const valueElement=document.getElementById('userNameValue');const closeButton=document.getElementById('userNameClose');if(userName&&badge&&valueElement){valueElement.textContent=userName;badge.classList.add('show');}else if(badge){badge.classList.remove('show');}if(closeButton){closeButton.addEventListener('click',()=>badge&&badge.classList.remove('show'));}};
    if(noticeCloseBtn){noticeCloseBtn.addEventListener('click',()=>{if(noticeAutoHideHandle){clearTimeout(noticeAutoHideHandle);noticeAutoHideHandle=null;}if(noticeBanner){noticeBanner.classList.add('hidden');}localStorage.setItem(NOTICE_KEY,'true');});}
    if(userInput){
      userInput.addEventListener('input',()=>{
        userInput.style.height='auto';
        userInput.style.height=`${Math.min(userInput.scrollHeight,110)}px`;
      });
      userInput.addEventListener('keydown',event=>{
        if(event.key==='Enter'&&!event.shiftKey){
          event.preventDefault();
          sendMessage();
        }
      });
    }
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        closeModal('aboutModal');
        closeModal('disclaimerModal');
        closeModal('resetModal');
      }
    });
    window.sendMessage=sendMessage;
    window.showAbout=showAbout;
    window.showDisclaimer=showDisclaimer;
    window.showResetConfirm=showResetConfirm;
    window.closeModal=closeModal;
    window.confirmReset=confirmReset;
    window.insertQuery=insertQuery;
    handleNotice();
    loadMessages();
    handleWeather();
    displayUserName();
    window.addEventListener('resize',()=>{if(!localStorage.getItem(NOTICE_KEY)){handleNotice();}});
  }
  function initStartingPage(){
    const introCard=document.getElementById('introCard');
    const enterBtn=document.getElementById('enterBtn');
    const skipToggle=document.getElementById('skipToggle');
    const disclaimerBtn=document.getElementById('disclaimerBtn');
    const disclaimerModal=document.getElementById('disclaimerModal');
    const closeDisclaimer=document.getElementById('closeDisclaimer');
    const nameFormModal=document.getElementById('nameFormModal');
    const nameForm=document.getElementById('nameForm');
    const userNameInput=document.getElementById('userName');
    const showNameForm=()=>{if(nameFormModal){nameFormModal.classList.add('active');if(userNameInput){setTimeout(()=>userNameInput.focus(),100);}}};
    const navigateToApp=userName=>{
      if(skipToggle&&skipToggle.checked){
        localStorage.setItem(SKIP_KEY,'true');
      }else{
        localStorage.removeItem(SKIP_KEY);
      }
      if(userName){
        localStorage.setItem(USER_NAME_KEY,userName);
      }
      if(nameFormModal){
        nameFormModal.classList.remove('active');
      }
      if(introCard){
        introCard.classList.add('leaving');
      }
      setTimeout(()=>{
        window.location.href=START_DESTINATION;
      },450);
    };
    const openDisclaimer=()=>{if(disclaimerModal){disclaimerModal.classList.add('active');}};
    const closeDisclaimerModal=()=>{if(disclaimerModal){disclaimerModal.classList.remove('active');}};
    enterBtn&&enterBtn.addEventListener('click',showNameForm);
    disclaimerBtn&&disclaimerBtn.addEventListener('click',openDisclaimer);
    closeDisclaimer&&closeDisclaimer.addEventListener('click',closeDisclaimerModal);
    disclaimerModal&&disclaimerModal.addEventListener('click',event=>{if(event.target===disclaimerModal){closeDisclaimerModal();}});
    nameFormModal&&nameFormModal.addEventListener('click',event=>{if(event.target===nameFormModal){nameFormModal.classList.remove('active');}});
    nameForm&&nameForm.addEventListener('submit',event=>{
      event.preventDefault();
      const value=(userNameInput&&userNameInput.value||'').trim();
      if(value){
        navigateToApp(value);
      }
    });
    window.addEventListener('load',()=>{
      if(localStorage.getItem(SKIP_KEY)==='true'){
        window.location.replace(START_DESTINATION);
      }
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const body=document.body;
    if(!body){return;}
    if(body.classList.contains('app-body')){
      initAppPage();
    }
    if(body.classList.contains('starting-body')){
      initStartingPage();
    }
  });
})();
