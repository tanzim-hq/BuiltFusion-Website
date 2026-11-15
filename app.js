/* TANZIMUL ISLAM — tanzimulislam.com — interactions */
(function(){
  "use strict";

  /* ---------- Sticky nav state ---------- */
  var nav = document.getElementById('nav');
  var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  var mobile = document.getElementById('navMobile');
  toggle.addEventListener('click', function(){
    var open = mobile.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mobile.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ mobile.classList.remove('open'); });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.section .card, .section .h2, .video-card, .cred-list li, .faq-item');
  revealEls.forEach(function(el){ el.classList.add('reveal'); });
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, {threshold:.12});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('visible'); });
  }

  /* ---------- Wistia thumbnails ----------
     For every .video-frame with a real ID — on the frame itself (hero)
     or on its .video-card (Proof) — fetch the thumbnail Wistia holds
     for that video and load it as a full-bleed cover. No API key and
     no token in client code: Wistia's public oEmbed endpoint returns
     thumbnail_url for a public/unlocked video. The frame gets
     .has-thumb, which hides the letterbox bars and scan sweep in CSS,
     so only the gold play button sits over the thumbnail. Frames with
     an empty ID stay as dark placeholders with a play button. If the
     fetch fails (locked video, network, blocked fetch), no image is
     inserted at all, so no broken icon ever shows.
     Forced high-res: Wistia's thumbnail_url already carries
     ?image_crop_resized=<WxH>. That value is replaced, not appended,
     with 1920x1080 for landscape and 1080x1920 for vertical. For
     Kitchen, oEmbed's native aspect is vertical, so 1080x1920 is an
     upscale of that native aspect, not a landscape-to-vertical crop.
     If the forced image fails to load, the original oEmbed URL is
     used; if that fails too, the frame stays a placeholder.
     CORS note: Wistia documents JSONP for cross-origin oEmbed calls,
     so fetch is tried first and JSONP (script tag + callback) is the
     fallback if fetch is blocked. */
  document.querySelectorAll('.video-frame').forEach(function(frame){
    var card = frame.closest('.video-card');
    var vid = '';
    if(card){ vid = (card.getAttribute('data-wistia') || '').trim(); }
    if(!vid){ vid = (frame.getAttribute('data-wistia') || '').trim(); }
    if(!vid){ return; }
    var isVertical = card ? card.getAttribute('data-orientation') === 'vertical' : false;
    var forcedSize = isVertical ? '1080x1920' : '1920x1080';
    function forceThumb(url){
      if(/image_crop_resized=[^&]*/.test(url)){
        return url.replace(/image_crop_resized=[^&]*/, 'image_crop_resized=' + forcedSize);
      }
      if(url.indexOf('?') !== -1){ return url + '&image_crop_resized=' + forcedSize; }
      return url + '?image_crop_resized=' + forcedSize;
    }
    function showThumb(url){
      var img = document.createElement('img');
      img.className = 'video-thumb';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      var triedOriginal = false;
      img.addEventListener('error', function(){
        if(!triedOriginal){
          triedOriginal = true;
          if(img.dataset.orig && img.src !== img.dataset.orig){
            img.src = img.dataset.orig;
            return;
          }
        }
        img.style.display = 'none';
        frame.classList.remove('has-thumb');
      });
      img.dataset.orig = url;
      img.src = forceThumb(url);
      frame.insertBefore(img, frame.firstChild);
      frame.classList.add('has-thumb');
    }
    function fetchThumb(){
      var oembed = 'https://fast.wistia.com/oembed?url=' + encodeURIComponent('https://home.wistia.com/medias/' + vid);
      fetch(oembed).then(function(r){
        if(!r.ok){ throw new Error('oembed ' + r.status); }
        return r.json();
      }).then(function(data){
        if(data && data.thumbnail_url){ showThumb(data.thumbnail_url); }
        else { throw new Error('no thumbnail_url'); }
      }).catch(function(){
        /* JSONP fallback for cross-origin oEmbed. */
        var cbName = 'wistiaThumbCb_' + vid.replace(/[^A-Za-z0-9]/g, '') + '_' + Math.floor(Math.random() * 1000000);
        var script = document.createElement('script');
        var done = false;
        function cleanup(){
          if(done){ return; }
          done = true;
          try{ delete window[cbName]; }catch(err){ window[cbName] = undefined; }
          if(script.parentNode){ script.parentNode.removeChild(script); }
        }
        window[cbName] = function(data){
          cleanup();
          if(data && data.thumbnail_url){ showThumb(data.thumbnail_url); }
        };
        script.onerror = cleanup;
        script.src = oembed + '&callback=' + cbName;
        document.head.appendChild(script);
        setTimeout(cleanup, 8000);
      });
    }
    fetchThumb();
  });

  /* ---------- Video modal ----------
     To embed a real video: set data-wistia="VIDEO_ID" on the
     .video-card article. The modal loads the Wistia embed.
     Leave it empty and the modal shows the placeholder state. */
  var modal = document.getElementById('videoModal');
  var modalBox = modal ? modal.querySelector('.modal-box') : null;
  var modalFrame = document.getElementById('modalFrame');
  var modalClose = document.getElementById('modalClose');
  var placeholderHTML = modalFrame.innerHTML;
  var modalToken = 0;

  function openModal(card, frame){
    /* Orientation comes from the Proof card's data-orientation.
       Hero has no .video-card parent, so it falls back to its own
       frame's data-wistia and to landscape — hero stays 16:9. */
    var vid = '';
    var isVertical = false;
    if(card){
      vid = (card.getAttribute('data-wistia') || '').trim();
      isVertical = card.getAttribute('data-orientation') === 'vertical';
    } else if(frame){
      vid = (frame.getAttribute('data-wistia') || '').trim();
    }
    if(modalBox){ modalBox.classList.toggle('modal-vertical', isVertical); }
    modalFrame.classList.toggle('modal-vertical', isVertical);
    modalFrame.innerHTML = '';
    if(vid){
      /* Real video: build the Wistia embed via DOM (no inline iframe markup).
         The wrap + .modal-video CSS give the cover-fill: the iframe is
         100% x 100% inside a 102% x 102% wrap, so no pillarbox or
         letterbox sliver ever shows, vertical or landscape. */
      modalToken++;
      var myToken = modalToken;
      var wrap = document.createElement('div');
      wrap.className = 'modal-wistia-wrap';
      var f = document.createElement('iframe');
      f.src = 'https://fast.wistia.net/embed/iframe/' + encodeURIComponent(vid) + '?autoPlay=true&endVideoBehavior=reset&controlsVisibleOnLoad=false&seo=false';
      f.title = 'Concept video';
      f.className = 'wistia_embed';
      f.name = 'wistia_embed';
      f.setAttribute('allowtransparency', 'true');
      f.setAttribute('scrolling', 'no');
      f.frameBorder = '0';
      f.allow = 'autoplay; fullscreen';
      f.allowFullscreen = true;
      wrap.appendChild(f);
      modalFrame.appendChild(wrap);
      modalFrame.classList.add('modal-video');
      /* End auto-close: Wistia Player API, via the _wq queue (the
         documented pattern for iframe embeds — the same syntax works
         with iframe embeds too) plus an immediate Wistia.api attempt
         if the API is already loaded. On 'end', close the modal, so
         no end screen ever sits in front of the user; endVideoBehavior
         =reset is the safety net if the API fails to load, giving a
         clean thumbnail inside the modal instead. The token guard
         stops an old video's end event closing a newer modal, and
         stops an end event firing after a manual close. If E-v1.js
         fails to load entirely, playback still works and the user
         closes with X / Escape / backdrop click as before. */
      function bindEnd(video){
        try{
          video.bind('end', function(){
            if(myToken === modalToken && !modal.hidden){ closeModal(); }
          });
        }catch(err){}
      }
      try{
        window._wq = window._wq || [];
        window._wq.push({ id: vid, onReady: function(video){ bindEnd(video); } });
      }catch(err){}
      try{
        if(window.Wistia && window.Wistia.api){
          var v = window.Wistia.api(vid);
          if(v){ bindEnd(v); }
        }
      }catch(err){}
    } else {
      modalFrame.innerHTML = placeholderHTML;
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }
  function closeModal(){
    modalToken++;
    modal.hidden = true;
    if(modalBox){ modalBox.classList.remove('modal-vertical'); }
    modalFrame.classList.remove('modal-vertical');
    modalFrame.classList.remove('modal-video');
    modalFrame.innerHTML = placeholderHTML;
    document.body.style.overflow = '';
  }
  document.querySelectorAll('.video-frame').forEach(function(frame){
    var card = frame.closest('.video-card');
    frame.addEventListener('click', function(){ openModal(card, frame); });
    frame.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(card, frame); }
    });
  });

  /* ---------- Proof descriptions: mobile expand/collapse ----------
     CSS (mobile only) clamps each description to 2 lines. Clicking a
     description toggles its own .expanded class; other cards are
     untouched. On desktop the CSS does not apply, so text stays full. */
  document.querySelectorAll('.proof-grid .video-card > p').forEach(function(p){
    p.setAttribute('tabindex', '0');
    p.setAttribute('role', 'button');
    p.setAttribute('aria-expanded', 'false');
    function toggleDesc(){
      var expanded = p.classList.toggle('expanded');
      p.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
    p.addEventListener('click', toggleDesc);
    p.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggleDesc(); }
    });
  });
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !modal.hidden) closeModal(); });

  /* ---------- Pilot intake form + Cal.com fusion ----------
     Flow: validate all 5 fields -> open the Cal modal with the data
     pre-filled -> success ONLY on a Cal booking event -> if the modal
     closes without a booking, show the incomplete warning.
     No page reload anywhere in this flow. */
  var form = document.getElementById('pilotForm');
  var success = document.getElementById('pilotSuccess');
  var formError = document.getElementById('formError');
  var incomplete = document.getElementById('bookingIncomplete');
  var tryAgainBtn = document.getElementById('tryAgainBtn');
  var calBooked = false;
  var calModalOpen = false;
  function hideIncomplete(){
    if(incomplete){ incomplete.hidden = true; }
  }
  function showIncomplete(){
    if(calBooked || !incomplete || !incomplete.hidden){ return; }
    incomplete.hidden = false;
    incomplete.scrollIntoView({behavior:'smooth', block:'center'});
  }
  function showTrueSuccess(){
    if(calBooked){ return; }
    calBooked = true;
    calModalOpen = false;
    hideIncomplete();
    formError.hidden = true;
    form.style.display = 'none';
    success.hidden = false;
    success.scrollIntoView({behavior:'smooth', block:'center'});
  }
  function resetToInitial(){
    calBooked = false;
    calModalOpen = false;
    form.reset();
    formError.hidden = true;
    hideIncomplete();
    form.style.display = '';
    success.hidden = true;
  }
  if(tryAgainBtn){
    tryAgainBtn.addEventListener('click', function(){
      resetToInitial();
    });
  }
  form.addEventListener('submit', function(e){
    e.preventDefault();
    /* No double-submit guard, by tanzim's explicit decision: every
       click actively triggers the Cal modal, and the multiple-modal
       edge case is accepted over a button that ever feels dead. */
    hideIncomplete();
    var els = form.elements;
    var name = (els.name.value || '').trim();
    var email = (els.email.value || '').trim();
    var website = (els.website.value || '').trim();
    var trade = els.trade.value;
    var budget = els.budget.value;
    /* Strict RegEx validation. Email: local@domain.tld with a real
       TLD of 2+ letters, so "wonder@gmail" fails. Website: optional
       protocol, domain labels, TLD of 2+ letters, optional port/path,
       so a single word with no extension fails. */
    var emailOk = /^[A-Za-z0-9]+[A-Za-z0-9._%+-]*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(email);
    var websiteOk = /^(https?:\/\/)?(www\.)?[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}(:[0-9]+)?(\/.*)?$/.test(website);
    /* Smart Fallback validation, in form order (Name, Email, Website,
       Trade, Budget). 1 error = its specific message; exactly 2 =
       one clean combined sentence; 3+ = the universal fallback, so
       no 20+ string permutations are ever generated. Focus always
       goes to the first invalid field, whichever message is shown. */
    var errors = [];
    if(!name){ errors.push({el: els.name, verb: 'enter', core: 'name', message: 'Please enter your name.'}); }
    if(!email){ errors.push({el: els.email, verb: 'enter', core: 'email', message: 'Please enter your email.'}); }
    else if(!emailOk){ errors.push({el: els.email, verb: 'enter', core: 'email', message: 'Please enter a valid email address.'}); }
    if(!website){ errors.push({el: els.website, verb: 'enter', core: 'website', message: 'Please enter your website.'}); }
    else if(!websiteOk){ errors.push({el: els.website, verb: 'enter', core: 'website', message: 'Please enter a valid website address.'}); }
    if(!trade){ errors.push({el: els.trade, verb: 'select', core: 'Trade', message: 'Please select your Trade.'}); }
    if(!budget){ errors.push({el: els.budget, verb: 'select', core: 'Monthly Ad Budget', message: 'Please select your Monthly Ad Budget.'}); }
    if(errors.length){
      if(errors.length === 1){
        formError.textContent = errors[0].message;
      }else if(errors.length === 2){
        var a = errors[0], b = errors[1];
        if(a.verb === b.verb){
          formError.textContent = 'Please ' + a.verb + ' your ' + a.core + ' and ' + b.core + '.';
        }else{
          formError.textContent = 'Please ' + a.verb + ' your ' + a.core + ' and ' + b.verb + ' your ' + b.core + '.';
        }
      }else{
        formError.textContent = 'Please complete your information correctly.';
      }
      formError.hidden = false;
      formError.scrollIntoView({behavior:'smooth', block:'center'});
      if(errors[0].el && errors[0].el.focus){ errors[0].el.focus(); }
      return;
    }
    formError.hidden = true;
    /* Cal-load fallback: if the Cal loader never produced a namespace
       (script blocked or failed), do not leave the user staring at a
       form that appears to do nothing. */
    if(!(window.Cal && window.Cal.ns && window.Cal.ns['discovery-call'])){
      formError.textContent = 'Booking calendar could not load. Please try again.';
      formError.hidden = false;
      return;
    }
    calModalOpen = true;
    /* Normalize for the Cal payload only: Cal expects a URL, so add
       https:// when the user typed a bare domain. The form field
       itself is left exactly as typed. */
    var payloadWebsite = /^https?:\/\//i.test(website) ? website : 'https://' + website;
    var payloadEmail = email.toLowerCase();
    /* Open the Cal modal dynamically with pre-fill. Cal's own docs use
       config.name / config.email for pre-fill and "metadata[key]" keys
       for webhook metadata; the plain website/trade/budget keys are
       passed as well so they can match Cal booking questions of the
       same name, if that is how they are configured in Cal. */
    try{
      if(window.Cal && window.Cal.ns && window.Cal.ns['discovery-call']){
        window.Cal.ns['discovery-call']('modal', {
          calLink: 'tanzimulislam/discovery-call',
          config: {
            name: name,
            email: payloadEmail,
            layout: 'month_view',
            useSlotsViewOnSmallScreen: 'true',
            theme: 'auto',
            hideEventTypeDetails: false,
            website: payloadWebsite,
            trade: trade,
            /* Budget fix: Cal pre-fills by the booking-question identifier
               (Advanced -> Booking Questions). Trade works because its
               identifier is the single word "trade"; the previous
               monthly_ad_budget (underscores) evidently did not match
               Cal's identifier for this field. Send the exact selected
               value under every plausible identifier — Cal ignores
               unknown keys, and the matching one pre-fills. */
            budget: budget,
            'monthly-ad-budget': budget,
            monthly_ad_budget: budget,
            monthlyAdBudget: budget,
            'ad-budget': budget,
            ad_budget: budget,
            'monthly-budget': budget,
            'Monthly Ad Budget': budget,
            'metadata[website]': payloadWebsite,
            'metadata[trade]': trade,
            'metadata[monthly-ad-budget]': budget,
            'metadata[monthly_ad_budget]': budget,
            'metadata[budget]': budget,
            'metadata[source]': 'tanzimulislam.com pilot form'
          }
        });
      }
    }catch(err){}
  });
  /* Cal event listeners. Cal's docs: bookingSuccessfulV2 deprecates
     bookingSuccessful, so listen to both with a once-guard. There is
     no public "ui_modal_closed" event in Cal's event reference, so
     close is detected via the internal __closeIframe action AND a
     MutationObserver on Cal's modal box (state="closed") as fallback;
     ui_modal_closed is also listened to in case it ever fires. */
  if(window.Cal && window.Cal.ns && window.Cal.ns['discovery-call']){
    var calNs = window.Cal.ns['discovery-call'];
    calNs('on', {action: 'bookingSuccessfulV2', callback: showTrueSuccess});
    calNs('on', {action: 'bookingSuccessful', callback: showTrueSuccess});
    calNs('on', {action: '__closeIframe', callback: function(){
      if(!calBooked){ calModalOpen = false; showIncomplete(); }
    }});
    calNs('on', {action: 'ui_modal_closed', callback: function(){
      if(!calBooked){ calModalOpen = false; showIncomplete(); }
    }});
  }
  if(window.MutationObserver && document.body){
    var calObserver = new MutationObserver(function(){
      if(!calModalOpen || calBooked){ return; }
      var boxes = document.querySelectorAll('cal-modal-box');
      for(var i = 0; i < boxes.length; i++){
        if(boxes[i].getAttribute('state') === 'closed'){
          calModalOpen = false;
          showIncomplete();
          break;
        }
      }
    });
    calObserver.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['state']});
  }

  /* ---------- Copy email ---------- */
  var copyBtn = document.getElementById('copyEmail');
  copyBtn.addEventListener('click', function(){
    var email = 'contact@builtfusion.com';
    function done(){
      copyBtn.classList.add('copied');
      copyBtn.textContent = '✓';
      setTimeout(function(){ copyBtn.classList.remove('copied'); copyBtn.textContent = '⧉'; }, 1600);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(email).then(done).catch(done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = email; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); }catch(err){}
      document.body.removeChild(ta); done();
    }
  });

  /* ---------- Sticky mobile CTA ----------
     Shows after the hero, hides while the pilot form is on screen. */
  var stickyCta = document.getElementById('stickyCta');
  var pilotSection = document.getElementById('pilot');
  var pilotVisible = false;
  function updateSticky(){
    var past = window.scrollY > 620;
    stickyCta.classList.toggle('show', past && !pilotVisible);
  }
  window.addEventListener('scroll', updateSticky, {passive:true});
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      pilotVisible = entries[0].isIntersecting;
      updateSticky();
    }, {threshold:.15}).observe(pilotSection);
  }
  updateSticky();

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();

/* ---------- Process timeline (Section 05) ----------
   Scroll-linked gold fill + step reveal. No-ops if the timeline
   is absent; content stays visible if JS or IO is unavailable. */
(function(){
  "use strict";
  var tl = document.getElementById('processTl');
  if(!tl){ return; }
  var tlFill = tl.querySelector('.tl-fill');
  var tlSteps = Array.prototype.slice.call(tl.querySelectorAll('.tl-step'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('tl-js');
  if(reduced){
    if(tlFill){ tlFill.style.height = '100%'; }
    tlSteps.forEach(function(s){ s.classList.add('in'); });
    return;
  }
  var ticking = false;
  function updateFill(){
    ticking = false;
    var r = tl.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var p = (vh * 0.8 - r.top) / (r.height + vh * 0.3);
    p = Math.max(0, Math.min(1, p));
    if(tlFill){ tlFill.style.height = (p * 100).toFixed(2) + '%'; }
  }
  function onScroll(){
    if(!ticking){ window.requestAnimationFrame(updateFill); ticking = true; }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  updateFill();
  if('IntersectionObserver' in window){
    var tio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); tio.unobserve(e.target); }
      });
    }, {threshold:.25, rootMargin:'0px 0px -10% 0px'});
    tlSteps.forEach(function(s){ tio.observe(s); });
  } else {
    tlSteps.forEach(function(s){ s.classList.add('in'); });
  }
})();
