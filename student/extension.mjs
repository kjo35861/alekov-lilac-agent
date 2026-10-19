// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('section');
      const deviceLabels = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };
      const sessionLabels = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };

      function line(parent, label, value) {
        const p = document.createElement('p');
        p.textContent = label + ': ' + (value == null || value === '' ? '확인 불가' : String(value));
        parent.appendChild(p);
      }

      function section(title, resource, showData) {
        const group = document.createElement('section');
        const heading = document.createElement('h3');
        heading.textContent = title;
        group.appendChild(heading);
        const mode = resource?.mode;
        if (mode === 'demo') line(group, '자료 모드', '예제 자료');
        if (mode === 'disconnected') line(group, '연결 상태', '연결 없음');
        if (mode === 'unknown') line(group, '연결 상태', '확인 불가');

        if (resource?.status === 'loading') {
          line(group, '조회 상태', '불러오는 중');
        } else if (resource?.status === 'error') {
          const message = resource.error?.message;
          line(group, '조회 상태', '연결 실패' + (typeof message === 'string' && message ? ': ' + message : ''));
        } else if (resource?.status === 'ok') {
          showData(group, resource.data);
        } else {
          line(group, '조회 상태', '확인 불가');
        }
        root.appendChild(group);
      }

      section('현재 계정 및 로그인 정보', me, (group, data) => {
        line(group, '사용자 이름', data?.user?.label);
        line(group, '사용자 ID', data?.user?.id);
        line(group, '현재 기기 이름', data?.device?.label);
        line(group, '현재 기기 ID', data?.device?.id);
        line(group, '현재 기기 보안 상태', (deviceLabels[data?.device?.status] ?? '확인 불가') + ' (' + (data?.device?.status ?? 'unknown') + ')');
        line(group, '현재 세션 ID', data?.session?.id);
        line(group, '현재 세션 상태', (sessionLabels[data?.session?.status] ?? '확인 불가') + ' (' + (data?.session?.status ?? 'unknown') + ')');
      });

      section('기기 목록', devices, (group, data) => {
        if (!Array.isArray(data)) {
          line(group, '기기 정보', '확인 불가');
          return;
        }
        if (data.length === 0) line(group, '기기 목록', '등록된 기기 없음');
        for (const device of data) {
          const item = document.createElement('div');
          line(item, '기기 이름', device?.label);
          line(item, '기기 ID', device?.id);
          line(item, '보안 상태', (deviceLabels[device?.status] ?? '확인 불가') + ' (' + (device?.status ?? 'unknown') + ')');
          group.appendChild(item);
        }
      });

      section('세션 목록', sessions, (group, data) => {
        if (!Array.isArray(data)) {
          line(group, '세션 정보', '확인 불가');
          return;
        }
        if (data.length === 0) line(group, '세션 목록', '세션 없음');
        for (const session of data) {
          const item = document.createElement('div');
          line(item, '세션 ID', session?.id);
          line(item, '세션 상태', (sessionLabels[session?.status] ?? '확인 불가') + ' (' + (session?.status ?? 'unknown') + ')');
          group.appendChild(item);
        }
      });
      return root;
    },
    renderDecision({ status = 'idle', mode, data, error, appId } = {}) {
      const root = document.createElement('section');
      const title = document.createElement('h3');
      title.textContent = '업무 앱 접근 요청 결과';
      root.appendChild(title);

      function show(label, value) {
        const row = document.createElement('p');
        row.textContent = label + ': ' + (value == null || value === '' ? '확인 불가' : String(value));
        root.appendChild(row);
      }

      if (mode === 'demo') show('자료 모드', '예제 자료');
      if (mode === 'disconnected') show('연결 상태', '연결 없음');
      if (mode === 'unknown') show('연결 상태', '확인 불가');

      if (status === 'idle') {
        show('요청 상태', '앱을 골라 접속을 요청하세요');
      } else if (status === 'loading') {
        show('요청 앱 ID', appId);
        show('요청 상태', '판정 확인 중');
      } else if (status === 'error') {
        show('요청 앱 ID', appId);
        const message = typeof error?.message === 'string' && error.message ? ': ' + error.message : '';
        show('요청 상태', '요청 실패' + message);
        show('판정 안내', '요청 실패는 접근 거부(deny) 판정이 아닙니다. 접근 허용 여부를 확인할 수 없습니다.');
      } else if (status === 'ok') {
        show('요청 앱 ID', data?.appId ?? appId);
        const decisions = {
          allow: '접근 허용',
          deny: '접근 거부',
          challenge: '추가 인증 또는 확인 필요',
          unknown: '판정 확인 불가',
        };
        const raw = data?.decision;
        const known = Object.prototype.hasOwnProperty.call(decisions, raw);
        const decision = known ? raw : 'unknown';
        show('접근 판정', decisions[decision] + ' (' + decision + ')');
        show('판정 이유', data?.reason);
        show('판정 시각', data?.checkedAt);
        if (decision === 'challenge') show('추가 확인 안내', '이 화면은 추가 인증 절차를 대신 수행하지 않습니다.');
        if (decision === 'unknown') show('접근 안내', '접근 허용 여부를 확인할 수 없습니다.');
      } else {
        show('요청 상태', '확인 불가');
        show('접근 안내', '접근 허용 여부를 확인할 수 없습니다.');
      }
      return root;
    },
    renderEvents({ status, mode, data, error } = {}) {
      const root = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = '내 접속 기록·XDR 경보';
      root.appendChild(heading);

      function addText(parent, label, value) {
        const p = document.createElement('p');
        p.textContent = label + ': ' + (value == null || value === '' ? '확인 불가' : String(value));
        parent.appendChild(p);
      }
      function codeLabel(value, labels) {
        const key = typeof value === 'string' && Object.prototype.hasOwnProperty.call(labels, value) ? value : 'unknown';
        return labels[key] + '(' + key + ')';
      }
      const accessLabels = { allowed: '접근 허용', denied: '접근 거부', unknown: '확인 불가' };
      const sessionLabels = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
      const deviceLabels = { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' };
      const kindLabels = { access: '접속 기록', xdr: 'XDR 경보' };

      if (mode === 'demo') addText(root, '자료 모드', '예제 자료');
      if (mode === 'disconnected') addText(root, '연결 상태', '연결 없음');
      if (mode === 'unknown') addText(root, '연결 상태', '확인 불가');

      if (status === 'loading') {
        addText(root, '조회 상태', '불러오는 중');
        return root;
      }
      if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message ? ': ' + error.message : '';
        addText(root, '조회 상태', error?.code === 'CONTRACT_MISMATCH'
          ? '기록을 불러오지 못했습니다 (계약 불일치, 확인 불가)' + message
          : '기록을 불러오지 못했습니다' + message);
        return root;
      }
      if (status !== 'ok' || !Array.isArray(data)) {
        addText(root, '조회 상태', '확인 불가');
        return root;
      }

      const events = [...data].sort((a, b) => {
        const aTime = Date.parse(a?.at ?? '') || 0;
        const bTime = Date.parse(b?.at ?? '') || 0;
        return bTime - aTime;
      });
      if (events.length === 0) {
        const p = document.createElement('p');
        p.textContent = '표시할 기록이 없습니다';
        root.appendChild(p);
        return root;
      }

      const filters = document.createElement('div');
      const rows = document.createElement('div');
      const count = document.createElement('p');
      const selection = { kind: 'all', appId: 'all', access: 'all' };

      function selectFilter(label, field, values) {
        const wrapper = document.createElement('div');
        const caption = document.createElement('label');
        const select = document.createElement('select');
        const all = document.createElement('option');
        all.value = 'all';
        all.textContent = '전체';
        select.appendChild(all);
        for (const value of values) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value === '' ? '앱 ID 없음' : value;
          select.appendChild(option);
        }
        caption.textContent = label;
        caption.appendChild(select);
        wrapper.appendChild(caption);
        filters.appendChild(wrapper);
        select.addEventListener('change', () => {
          selection[field] = select.value;
          drawRows();
        });
      }
      function values(field) {
        return [...new Set(events.map(event => {
          if (field === 'access') return event?.state?.access ?? 'unknown';
          return event?.[field] ?? '';
        }))].sort();
      }
      selectFilter('기록 종류', 'kind', values('kind'));
      selectFilter('업무 앱', 'appId', values('appId'));
      selectFilter('접속 상태', 'access', values('access'));
      root.appendChild(filters);
      root.appendChild(count);
      root.appendChild(rows);

      function detailFor(event) {
        const detail = document.createElement('section');
        detail.setAttribute('data-student-event-detail', String(event.id));
        addText(detail, '사건 ID', event.id);
        addText(detail, '업무 앱 ID', event.appId || '앱을 확인할 수 없음');
        for (const [label, entries] of [['근거', event.evidence], ['규칙', event.rules]]) {
          const h = document.createElement('h4');
          h.textContent = label;
          detail.appendChild(h);
          if (!Array.isArray(entries) || entries.length === 0) {
            addText(detail, label, '확인 불가');
          } else {
            for (const entry of entries) addText(detail, entry?.id, entry?.text);
          }
        }
        addText(detail, '접속 상태', codeLabel(event.state?.access, accessLabels));
        addText(detail, '세션 상태', codeLabel(event.state?.session, sessionLabels));
        addText(detail, '기기 상태', codeLabel(event.state?.device, deviceLabels));
        return detail;
      }
      function drawRows() {
        rows.replaceChildren();
        const shown = events.filter(event =>
          (selection.kind === 'all' || event?.kind === selection.kind) &&
          (selection.appId === 'all' || (event?.appId ?? '') === selection.appId) &&
          (selection.access === 'all' || (event?.state?.access ?? 'unknown') === selection.access)
        );
        count.textContent = '표시 기록: ' + shown.length + '건 / 조회 기록: ' + events.length + '건';
        if (shown.length === 0) {
          const empty = document.createElement('p');
          empty.textContent = '필터 조건에 맞는 기록이 없습니다';
          rows.appendChild(empty);
        }
        for (const event of shown) {
          const row = document.createElement('section');
          row.setAttribute('data-student-event-id', String(event.id));
          addText(row, '사건 ID', event.id);
          addText(row, '시각', event.at);
          addText(row, '종류', (kindLabels[event.kind] ?? '확인 불가') + ' (' + event.kind + ')');
          addText(row, '업무 앱', event.appId || '앱을 확인할 수 없음');
          addText(row, '요약', event.summary);
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = String(event.id) + ' 상세';
          button.addEventListener('click', () => {
            const previous = row.querySelector('[data-student-event-detail]');
            if (previous) previous.remove();
            else row.appendChild(detailFor(event));
          });
          row.appendChild(button);
          rows.appendChild(row);
        }
      }
      drawRows();
      return root;
    },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
