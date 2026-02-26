const AUTO_MS = 5000;

    const timelineEvents = () => document.querySelectorAll(".event");
    const cards = () => document.querySelectorAll("#cardStage .card");
    let currentIndex = 0;

    function setActiveDot(index){
      timelineEvents().forEach(e => e.classList.remove("active"));
      const ev = timelineEvents()[index];
      if(ev) ev.classList.add("active");
    }

    function centerTimelineOn(index){
      const timeline = document.getElementById("timelineEvents");
      const totalEvents = timelineEvents().length;
      const eventWidth = 150;
      const visibleWidth = timeline.parentElement.offsetWidth;
      const maxOffset = -(totalEvents * eventWidth - visibleWidth + eventWidth);
      const offset = Math.max(maxOffset, -index * eventWidth);
      timeline.style.transform = `translateX(${offset}px)`;
    }

    function hideAllCards(){ cards().forEach(c => c.hidden = true); }

    function pauseAllMedia(){
      document.querySelectorAll(".media-box").forEach(box => {
        const state = getMediaState(box);
        state.paused = true;
        updateToggleText(box, state);
        stopMediaTimer(state);
        box.querySelectorAll("video").forEach(v => { try { v.pause(); } catch(e){} });
      });
    }

    function showCard(index){
      pauseAllMedia();
      hideAllCards();

      const c = document.getElementById(`card-${index}`);
      if(c) c.hidden = false;

      setActiveDot(index);
      centerTimelineOn(index);

      const coord = document.getElementById("coordinators-container");
      coord.style.visibility = (index === 0) ? "visible" : "hidden";

      if(c){
        const mediaBox = c.querySelector(".media-box");
        if(mediaBox) startMediaAutoplay(mediaBox);
      }
    }

    function selectEvent(index){
      const max = timelineEvents().length - 1;
      currentIndex = Math.max(0, Math.min(index, max));
      showCard(currentIndex);
    }
    function moveTimeline(direction){ selectEvent(currentIndex + direction); }

    // ======= CARRUSEL DE IMÁGENES =======
    const mediaStates = new WeakMap();

    function getMediaState(mediaBox){
      if(!mediaStates.has(mediaBox)){
        mediaStates.set(mediaBox, { idx: 0, paused: false, timer: null });
      }
      return mediaStates.get(mediaBox);
    }

    function getItems(mediaBox){
      const viewport = mediaBox.querySelector(".image-carousel .media-viewport") || mediaBox.querySelector(".media-viewport");
      return viewport ? Array.from(viewport.querySelectorAll(".media-item")) : [];
    }

    function updateCounter(mediaBox, idx, total){
      const counter = mediaBox.querySelector("[data-counter]");
      if(counter) counter.textContent = `${idx + 1}/${total}`;
    }

    function updateToggleText(mediaBox, state){
      const btn = mediaBox.querySelector('[data-action="toggle"]');
      if(btn) btn.textContent = state.paused ? "Reanudar" : "Pausar";
    }

    function showMediaIndex(mediaBox, idx){
      const items = getItems(mediaBox);
      if(items.length === 0) return;
      items.forEach((it, i) => it.classList.toggle("active", i === idx));
      updateCounter(mediaBox, idx, items.length);
    }

    function stopMediaTimer(state){
      if(state.timer){
        clearInterval(state.timer);
        state.timer = null;
      }
    }

    function nextMedia(mediaBox){
      const state = getMediaState(mediaBox);
      const items = getItems(mediaBox);
      if(items.length <= 1) return;
      state.idx = (state.idx + 1) % items.length;
      showMediaIndex(mediaBox, state.idx);
    }

    function prevMedia(mediaBox){
      const state = getMediaState(mediaBox);
      const items = getItems(mediaBox);
      if(items.length <= 1) return;
      state.idx = (state.idx - 1 + items.length) % items.length;
      showMediaIndex(mediaBox, state.idx);
    }

    function startMediaAutoplay(mediaBox){
      const state = getMediaState(mediaBox);
      const items = getItems(mediaBox);

      state.idx = 0;
      state.paused = false;
      updateToggleText(mediaBox, state);
      showMediaIndex(mediaBox, state.idx);

      stopMediaTimer(state);

      if(items.length > 1){
        state.timer = setInterval(() => {
          if(!state.paused) nextMedia(mediaBox);
        }, AUTO_MS);
      }
    }

    function wireMediaControls(){
      document.querySelectorAll(".media-box").forEach(mediaBox => {
        const state = getMediaState(mediaBox);
        updateToggleText(mediaBox, state);

        const prevBtn = mediaBox.querySelector('[data-action="prev"]');
        const nextBtn = mediaBox.querySelector('[data-action="next"]');
        const toggleBtn = mediaBox.querySelector('[data-action="toggle"]');

        if(prevBtn){
          prevBtn.addEventListener("click", () => {
            state.paused = true;
            updateToggleText(mediaBox, state);
            prevMedia(mediaBox);
          });
        }

        if(nextBtn){
          nextBtn.addEventListener("click", () => {
            state.paused = true;
            updateToggleText(mediaBox, state);
            nextMedia(mediaBox);
          });
        }

        if(toggleBtn){
          toggleBtn.addEventListener("click", () => {
            state.paused = !state.paused;
            updateToggleText(mediaBox, state);
          });
        }
      });

      // Pausa el carrusel si se reproduce un video; reanuda al finalizar. [web:89]
      document.querySelectorAll(".video-area video").forEach(v => {
        v.addEventListener("play", () => {
          const mediaBox = v.closest(".media-box");
          if(!mediaBox) return;
          const state = getMediaState(mediaBox);
          state.paused = true;
          updateToggleText(mediaBox, state);
          stopMediaTimer(state);
        });

        v.addEventListener("ended", () => {
          const mediaBox = v.closest(".media-box");
          if(!mediaBox) return;
          startMediaAutoplay(mediaBox);
        });
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll('.circle').forEach(c => c.style.zIndex = 3);
      wireMediaControls();
      selectEvent(0);
    });