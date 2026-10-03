    function renderChildrenList() {
      const container = document.getElementById('container-children-list');
      if (!container) return;
      const focusState = saveFocusState();
      container.innerHTML = '';

      (state.children || []).forEach(k => {
        const div = document.createElement('div');
        div.className = "p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-center text-xs";
        div.innerHTML = `
          <div>
            <label class="text-[10px] text-slate-400 block font-semibold">${t('childLabelName')}</label>
            <input type="text" data-focus-key="child-${k.id}-name" value="${escapeHtml(k.name)}" oninput="updateChild(${k.id}, 'name', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block font-semibold">${t('childLabelAge')}</label>
            <input type="number" data-focus-key="child-${k.id}-age" value="${k.age}" oninput="updateChild(${k.id}, 'age', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block font-semibold">${t('childLabelSchool')}</label>
            <input type="number" data-focus-key="child-${k.id}-schoolMonthly" value="${k.schoolMonthly}" oninput="updateChild(${k.id}, 'schoolMonthly', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold text-amber-300">
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block font-semibold">${t('childLabelCollege')}</label>
            <input type="number" data-focus-key="child-${k.id}-collegeMonthly" value="${k.collegeMonthly}" oninput="updateChild(${k.id}, 'collegeMonthly', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
          </div>
          <div class="flex items-center justify-between gap-2">
            <div class="flex-1">
              <label class="text-[10px] text-slate-400 block font-semibold flex items-center">
                ${t('childLabelIndependence')}
                <span class="field-tip">?<span class="field-tip-content">${t('childIndependenceTip')}</span></span>
              </label>
              <input type="number" data-focus-key="child-${k.id}-independenceAge" value="${k.independenceAge}" oninput="updateChild(${k.id}, 'independenceAge', this.value)" class="w-full glass-input rounded-lg px-2.5 py-1 font-bold">
            </div>
            <button onclick="removeChild(${k.id})" class="text-rose-400 hover:text-rose-300 font-bold p-1 self-end" title="${t('btnDelete')}">✕</button>
          </div>
        `;
        container.appendChild(div);
      });
      restoreFocusState(focusState);
    }

    window.addChild = function() {
      state.children.push({
        id: Date.now(),
        name: t('childNewName'),
        age: 5,
        schoolMonthly: 1800,
        collegeMonthly: 3000,
        independenceAge: 23
      });
      handleDataUpdate();
    };

    window.removeChild = function(id) {
      state.children = state.children.filter(k => k.id !== id);
      handleDataUpdate();
    };

    window.updateChild = function(id, field, val) {
      const k = state.children.find(x => x.id === id);
      if (k) {
        k[field] = ['age', 'schoolMonthly', 'collegeMonthly', 'independenceAge'].includes(field) ? (parseFloat(val) || 0) : val;
        handleDataUpdate();
      }
    };

