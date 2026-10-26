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
        if (Array.isArray(event.supportedActions)) {
          for (const action of event.supportedActions) {
            if (typeof action !== 'string' || !action) continue;
            const button = document.createElement('button');
            button.type = 'button';
            button.disabled = true;
            button.textContent = action + ' 미지원';
            detail.appendChild(button);
            addText(detail, '조치 안내', action + ': 조치 실행 연결은 준비 중입니다');
          }
        }
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
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = '기기·세션·알림 및 연결 진단';
      root.appendChild(heading);
      const deviceLabels = { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' };
      const sessionLabels = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
      const safe = value => value == null || value === '' ? '확인 불가' : String(value);

      function show(parent, label, value) {
        const line = document.createElement('p');
        line.textContent = label + ': ' + safe(value);
        parent.appendChild(line);
      }
      function title(text) {
        const h = document.createElement('h4');
        h.textContent = text;
        root.appendChild(h);
      }
      function showMode(resource) {
        if (resource?.mode === 'demo') show(root, '자료 모드', '예제 자료');
        if (resource?.mode === 'disconnected') show(root, '연결 상태', '연결 없음');
        if (resource?.mode === 'unknown') show(root, '연결 상태', '확인 불가');
      }
      function statusText(code, labels) {
        const key = typeof code === 'string' && Object.prototype.hasOwnProperty.call(labels, code) ? code : 'unknown';
        return labels[key] + ' (' + key + ')';
      }
      function showError(name, resource) {
        const message = typeof resource?.error?.message === 'string' ? resource.error.message : '';
        const code = resource?.error?.code;
        show(root, name + ' 조회 실패', (code === 'TIMEOUT' || /timeout|timed out|시간 초과/i.test(message) ? '시간 초과: ' : '') + (message || '확인 불가'));
        show(root, '다시 시도', '위쪽 다시 불러오기 버튼을 직접 누르세요');
      }
      if (mode === 'demo') show(root, '전체 자료 모드', '예제 자료');
      if (mode === 'disconnected') show(root, '전체 연결 상태', '연결 없음');
      if (mode === 'unknown') show(root, '전체 연결 상태', '확인 불가');

      title('등록 기기');
      showMode(devices);
      if (devices?.status === 'loading') show(root, '기기 조회', '불러오는 중');
      else if (devices?.status === 'error') showError('기기', devices);
      else if (devices?.status === 'ok' && Array.isArray(devices.data)) {
        if (!devices.data.length) show(root, '기기 목록', '등록된 기기가 없음');
        for (const device of devices.data) {
          show(root, '기기 이름', device?.label);
          show(root, '기기 보안 상태', statusText(device?.status, deviceLabels));
        }
      } else show(root, '기기 조회', '확인 불가');

      title('현재 세션');
      show(root, '조회 범위', '지금 검증된 연결 한 개만 표시하며 지난 세션 전체 목록이 아닙니다');
      showMode(sessions);
      if (sessions?.status === 'loading') show(root, '세션 조회', '불러오는 중');
      else if (sessions?.status === 'error') showError('세션', sessions);
      else if (sessions?.status === 'ok' && Array.isArray(sessions.data)) {
        if (!sessions.data.length) show(root, '세션 목록', '현재 연결 없음');
        for (const session of sessions.data) {
          show(root, '세션 ID', session?.id);
          show(root, '세션 상태', statusText(session?.status, sessionLabels));
        }
      } else show(root, '세션 조회', '확인 불가');

      title('주의 알림');
      if (!Array.isArray(notifications) || notifications.length === 0) {
        show(root, '알림', '주의할 알림이 없습니다');
      } else {
        for (const notice of notifications) {
          const item = document.createElement('section');
          show(item, '자료', notice?.resource);
          show(item, '알림 코드', notice?.code);
          show(item, '알림 내용', notice?.message);
          root.appendChild(item);
        }
      }

      title('진단 정보');
      showMode(diagnostics);
      const fields = [
        ['requestId', diagnostics?.data?.requestId],
        ['component', diagnostics?.data?.component],
        ['version', diagnostics?.data?.version],
        ['checkedAt', diagnostics?.data?.checkedAt],
        ['engine.mode', diagnostics?.data?.engine?.mode],
        ['engine.code', diagnostics?.data?.engine?.code],
      ];
      if (diagnostics?.status === 'loading') show(root, '진단 조회', '불러오는 중');
      else if (diagnostics?.status === 'error') showError('진단 정보', diagnostics);
      else if (diagnostics?.status === 'ok') {
        for (const [key, value] of fields) show(root, key, value);
      } else show(root, '진단 조회', '확인 불가');

      show(root, '도움정보 안내', '아래 버튼을 누르면 허용된 진단 항목만 도움 요청용으로 복사합니다');
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.textContent = '도움정보 복사';
      copy.disabled = diagnostics?.status !== 'ok';
      const feedback = document.createElement('p');
      copy.addEventListener('click', async () => {
        if (diagnostics?.status !== 'ok') return;
        const body = fields.map(([key, value]) => key + ': ' + safe(value)).join('\n');
        try {
          await navigator.clipboard.writeText(body);
          feedback.textContent = '도움정보 복사 완료';
        } catch {
          feedback.textContent = '도움정보를 복사하지 못했습니다';
        }
      });
      root.appendChild(copy);
      root.appendChild(feedback);
      return root;
    },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection({ status = 'idle', mode, data, error, checkedAt, explanationAccepted = false } = {}) {
      const root = document.createElement('section');
      const title = document.createElement('h3');
      title.textContent = '앱 내부 AI 연결 점검';
      root.appendChild(title);
      function show(label, value) {
        const line = document.createElement('p');
        line.textContent = label + ': ' + (value == null || value === '' ? '확인 불가' : String(value));
        root.appendChild(line);
      }
      if (mode === 'demo') show('자료 모드', '예제 자료');
      if (mode === 'disconnected') show('연결 상태', '연결 없음');
      if (mode === 'unknown') show('연결 상태', '확인 불가');

      if (status === 'idle') {
        show('점검 상태', 'AI 연결 점검 전');
      } else if (status === 'loading') {
        show('점검 상태', 'AI 연결 점검 중');
      } else if (status === 'ok') {
        const authorization = data?.audienceAuthorization;
        const label = authorization === 'verified' ? '앱 권한 확인 후 점검(verified)'
          : authorization === 'test' ? '시험 연결 점검(test)' : '확인 불가(unknown)';
        show('점검 결과', label);
        show('모델 응답 수', data?.modelCount);
        show('점검 시각', checkedAt);
        if (authorization === 'test') show('연결 안내', '시험 연결이며 실제 앱 권한 확인을 의미하지 않습니다');
        if (authorization !== 'verified' && authorization !== 'test') show('연결 안내', '앱 권한 확인 여부를 확인할 수 없습니다');
        show('사건 설명', explanationAccepted === true
          ? '연결 점검으로는 사건 설명 실행 여부를 확인할 수 없습니다. 보안 기록에서 별도로 확인하세요.'
          : '사건 설명은 아직 실행하지 않았습니다. 보안 기록에서 별도로 요청하고 확인하세요.');
      } else if (status === 'error') {
        const guides = {
          ON_AI_PROVISIONING_PENDING: '권한 준비 중입니다. 담당자에게 계정 연결과 앱 권한 확인을 요청하세요',
          WB_CLCO_AUTH_REQUIRED: '인증 실패입니다. 계정 연결을 다시 확인하고 담당자에게 문의하세요',
          WB_CLCO_ACCESS_BLOCKED: '접근 제한입니다. 계정 연결과 앱 이용 권한을 담당자에게 확인하세요',
          ON_AI_AUTHORIZATION_CHANGED: '앱 이용 권한이 변경됐습니다. 담당자에게 현재 권한을 확인하세요',
          WB_CLCO_COHORT_BUDGET_EXHAUSTED: '반 AI 사용량이 소진됐습니다. 담당자에게 확인하세요',
          WB_CLCO_LIMIT_REACHED: 'AI 이용 한도에 도달했습니다. 담당자에게 확인하세요',
          WB_CLCO_SESSION_CLOSED: 'AI 이용 시간이 아닙니다. 이용 시간을 확인하세요',
          WB_CLCO_RATE_LIMITED: '요청 제한입니다. 잠시 후 직접 다시 점검하세요',
          NETWORK_ERROR: '네트워크 연결 실패입니다. 네트워크 상태를 확인하고 잠시 후 직접 다시 점검하세요',
          WB_CLCO_NETWORK_ERROR: 'AI 게이트 네트워크 연결 실패입니다. 네트워크 상태를 확인하고 잠시 후 직접 다시 점검하세요',
          WB_CLCO_TIMEOUT: '시간 초과입니다. 잠시 후 직접 다시 점검하세요',
          REQUEST_TIMEOUT: '시간 초과입니다. 잠시 후 직접 다시 점검하세요',
          ENGINE_TIMEOUT: '시간 초과입니다. 잠시 후 직접 다시 점검하세요',
          TIMEOUT: '시간 초과입니다. 잠시 후 직접 다시 점검하세요',
          WB_CLCO_CANCELLED: '요청이 취소됐습니다. 이전 결과는 현재 결과가 아닙니다',
          CANCELLED: '요청이 취소됐습니다. 이전 결과는 현재 결과가 아닙니다',
          REQUEST_CANCELLED: '요청이 취소됐습니다. 이전 결과는 현재 결과가 아닙니다',
          MODEL_NOT_CONFIGURED: '사용할 모델이 설정되지 않았습니다. 담당자에게 모델 허용 설정을 확인하세요',
          ON_AI_MODEL_LIST_EMPTY: '사용 가능한 모델이 없습니다. 담당자에게 모델 허용 설정을 확인하세요',
          AI_REQUEST_UNVERIFIED: '연결 또는 권한을 확인할 수 없습니다. 담당자에게 계정 연결과 앱 권한을 확인하세요',
        };
        const code = typeof error?.code === 'string' && Object.prototype.hasOwnProperty.call(guides, error.code)
          ? error.code : 'AI_REQUEST_UNVERIFIED';
        show('점검 상태', 'AI 연결 점검 실패');
        show('오류 코드', code);
        show('오류 메시지', typeof error?.message === 'string' ? error.message : '확인 불가');
        show('안내', guides[code]);
      } else {
        show('점검 상태', '확인 불가');
      }
      if (status !== 'loading') show('수동 점검', '재점검은 위쪽 현재 API 연결 점검 버튼을 직접 누르세요. 자동 재점검은 하지 않습니다');
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = 'AI 설명(참고용)';
      root.appendChild(heading);
      function show(label, value) {
        const p = document.createElement('p');
        p.textContent = label + ': ' + (value == null || value === '' ? '확인 불가' : String(value));
        root.appendChild(p);
      }
      function fail(reason, code) {
        show('설명 상태', 'AI 설명을 사용할 수 없습니다');
        show('실패 이유', reason);
        if (code) show('오류 코드', code);
        show('기록 상태', '보안 기록은 그대로입니다. AI 설명 실패는 과제 실패가 아닙니다');
      }
      if (explanation?.status === 'error') {
        show('설명 상태', 'AI 설명 실패');
        show('오류 코드', explanation.error?.code ?? 'AI_REQUEST_UNVERIFIED');
        show('오류 메시지', explanation.error?.message);
        show('기록 상태', '보안 기록은 그대로입니다. AI 설명 실패는 과제 실패가 아닙니다');
        return root;
      }
      if (!event) {
        show('설명 상태', '보안 기록에서 기록을 먼저 고르세요');
        return root;
      }
      if (explanation?.status === 'loading') {
        show('사건 ID', event.id);
        show('설명 상태', '설명 요청 중');
        return root;
      }
      if (explanation?.status !== 'ok') {
        show('설명 상태', '사건 설명 요청 전');
        return root;
      }

      const data = explanation.data;
      if (!data || typeof data.summary !== 'string' || !Array.isArray(data.evidenceIds)
          || !Array.isArray(event.evidence) || !Array.isArray(event.rules)
          || !Array.isArray(data.proposals)) {
        fail('설명 또는 사건 근거의 형식이 맞지 않습니다', 'ON_AI_INVALID_OUTPUT');
        return root;
      }
      if (data.executed !== false || data.requiresHumanConfirmation !== true) {
        fail('AI 설명에 실행 완료 또는 사람 확인 조건 불일치가 있습니다. 실행된 설명으로 표시할 수 없습니다', 'ON_AI_INVALID_OUTPUT');
        return root;
      }
      const evidenceMap = new Map(event.evidence.map(item => [item.id, item.text]));
      const expected = new Set(event.evidence.map(item => item.id));
      const cited = new Set(data.evidenceIds);
      if (cited.size !== data.evidenceIds.length || cited.size !== expected.size
          || data.evidenceIds.some(id => !evidenceMap.has(id))) {
        fail('설명 근거 ID가 현재 사건의 근거와 일치하지 않습니다. 없는 근거를 만들어 표시하지 않습니다', 'ON_AI_INVALID_OUTPUT');
        return root;
      }
      if (data.proposals.some(proposal =>
        !proposal || typeof proposal.action !== 'string'
        || typeof proposal.reason !== 'string'
        || !Array.isArray(proposal.evidenceIds)
        || proposal.evidenceIds.some(id => !evidenceMap.has(id))
        || !Array.isArray(event.supportedActions)
        || !event.supportedActions.includes(proposal.action))) {
        fail('제안한 조치 또는 근거가 현재 사건과 일치하지 않습니다', 'ON_AI_INVALID_OUTPUT');
        return root;
      }

      root.setAttribute('data-student-explanation-event', String(event.id));
      show('사건 ID', event.id);
      show('AI 요약(참고용)', data.summary);
      show('확인 시각', checkedAt);
      const evidenceTitle = document.createElement('h4');
      evidenceTitle.textContent = '현재 기록에서 확인된 인용 근거';
      root.appendChild(evidenceTitle);
      for (const id of data.evidenceIds) show('근거 ' + id, evidenceMap.get(id));
      const rulesTitle = document.createElement('h4');
      rulesTitle.textContent = '연동 시스템의 규칙';
      root.appendChild(rulesTitle);
      if (event.rules.length === 0) show('규칙', '확인 불가');
      for (const rule of event.rules) show('규칙 ' + rule.id, rule.text);

      const unknown = [
        ['접속', event.state?.access],
        ['세션', event.state?.session],
        ['기기', event.state?.device],
      ].filter(([, value]) => value == null || value === 'unknown');
      const unknownTitle = document.createElement('h4');
      unknownTitle.textContent = '확인 불가 상태';
      root.appendChild(unknownTitle);
      if (unknown.length === 0) show('확인 불가 상태', '없음');
      else for (const [label] of unknown) show(label, '확인 불가(unknown)');

      const proposalTitle = document.createElement('h4');
      proposalTitle.textContent = 'AI 조치 제안(미실행)';
      root.appendChild(proposalTitle);
      if (data.proposals.length === 0) {
        show('제안', Array.isArray(event.supportedActions) && event.supportedActions.length === 0
          ? '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상)'
          : 'AI가 제안한 조치가 없습니다');
      } else {
        for (const proposal of data.proposals) {
          show('제안 조치', proposal.action);
          show('제안 이유', proposal.reason);
          show('실행 상태', '사람 확인이 필요하며 실행되지 않았습니다');
        }
      }
      show('보안 조치', 'AI 설명과 제안만으로 보안 조치는 실행되지 않습니다');
      return root;
    },
    renderAction({ status = 'idle', event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      const root = document.createElement('section');
      const heading = document.createElement('h3');
      heading.textContent = '보안 조치 요청 및 실제 결과';
      root.appendChild(heading);
      function show(label, value) {
        const row = document.createElement('p');
        row.textContent = label + ': ' + (value == null || value === '' ? '확인 불가' : String(value));
        root.appendChild(row);
      }
      const states = {
        idle: '아직 미실행',
        loading: '조치 준비 또는 결과 조회 중 · 완료 아님',
        prepared: '준비됨·미실행 · 사람의 대상 및 조치 확인 필요',
        executing: '서버에 전달 중 · 결과가 아직 확인되지 않음',
        pending: '서버 접수·처리 중 · 접수 응답(ACK)은 효과 확인이 아님',
        denied: '연동 시스템에서 거절됨',
        failed: '연동 시스템에서 실패함',
        unknown: '결과 불명 · 성공이나 효과 없음으로 판단할 수 없음',
        expired: '확인 기한 지남 · 다시 준비 필요',
        error: '조치 요청이 처리되지 않음',
        succeeded: '결과 불명 · 실제 효과를 확인할 수 없음',
      };
      const confirmed = status === 'succeeded' && observation?.effectApplied === true;
      const description = confirmed ? '효과 확인(succeeded)' : (states[status] ?? '결과 불명 · 상태 확인 불가');
      show('조치 상태', description + ' (' + (status === 'succeeded' && !confirmed ? 'unknown' : status) + ')');
      if (event?.id != null) {
        show('현재 사건 ID', event.id);
        if (Array.isArray(event.evidence)) for (const evidence of event.evidence) {
          if (evidence?.id != null) show('근거 ID', evidence.id);
        }
      }
      if (actionId != null) show('조치 ID', actionId);
      if (target?.id != null) show('실제 대상 ID', target.id);
      if (target?.generation != null) show('대상 세대', target.generation);
      if (receipt?.requestId != null) show('요청 ID', receipt.requestId);
      if (receipt?.receiptId != null) show('접수 확인 ID', receipt.receiptId);
      if (receipt?.version != null) show('서버 결과 버전', receipt.version);
      if (receipt?.status != null) show('서버 응답 상태', receipt.status);
      if (receipt?.replayed === true) show('중복 요청 처리', '기존 요청의 응답 재사용(replayed) · 새 효과 확인 아님');
      if (status === 'prepared') {
        show('확인 기한', confirmationExpiresAt);
        show('사람 확인', '제공 화면에서 실제 대상과 조치를 확인해야 하며 아직 집행되지 않았습니다');
      }
      if (status === 'executing' || status === 'pending') {
        show('효과 관측', '아직 확인되지 않았습니다');
      }
      if (confirmed) {
        show('관측 시각', observation.observedAt);
        show('effectApplied', 'true');
        show('효과 확인 접수 ID', receipt?.receiptId);
      } else if (status === 'succeeded' || status === 'unknown') {
        show('관측 결과', '결과 불명(unknown) · 효과 없음 또는 성공으로 단정하지 마세요');
        show('재확인', '제공 화면의 「연동 시스템 결과만 재조회」를 직접 사용하세요');
      }
      if (status === 'expired') show('다음 단계', '제공 화면에서 조치를 다시 준비하세요');
      if (status === 'denied' || status === 'failed') show('거절·실패 사유', message ?? error?.message);
      if (status === 'error') {
        if (error?.code != null) show('오류 코드', error.code);
        show('오류 메시지', error?.message);
      }
      if (message && !['denied', 'failed', 'error'].includes(status)) show('진행 안내', message);
      if (status === 'idle' && Array.isArray(event?.supportedActions) && event.supportedActions.length === 0) {
        show('지원 조치', '연동 시스템이 지원하는 조치가 없어 조치 준비 버튼이 나타나지 않는 것이 정상입니다');
      }
      if (event?.id != null) root.setAttribute('data-student-action-event', String(event.id));
      if (receipt?.requestId != null) root.setAttribute('data-student-action-request', String(receipt.requestId));
      show('취소 안내', '조치 화면 취소는 이미 서버에 전달된 조치 효과를 되돌리지 않습니다');
      return root;
    },
  };
}
