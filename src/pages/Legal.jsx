import React from 'react';
import { useParams } from 'react-router-dom';

function Legal() {
  const { type } = useParams();
  
  const content = {
    terms: {
      title: '서비스 이용약관',
      body: `제 1 조 (목적)
이 약관은 태드스마트견적(이하 "회사")이 제공하는 Dearest 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제 2 조 (용어의 정의)
1. "서비스"라 함은 회사가 제공하는 영상 병합, 타임캡슐, 보이스북 등의 기능을 의미합니다.
2. "회원"이라 함은 서비스에 접속하여 이 약관에 따라 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.
3. "유료 서비스"라 함은 회사가 유료로 제공하는 각종 디지털 콘텐츠 및 제반 서비스를 의미합니다.

제 3 조 (유료 서비스의 이용 및 결제)
1. 회원은 회사가 정한 결제 수단(카드, 가상계좌 등)을 통해 유료 서비스를 구매할 수 있습니다.
2. 유료 서비스는 구매 즉시 효력이 발생하며, 디지털 콘텐츠의 특성상 영상 제작이 완료된 후에는 환불이 제한될 수 있습니다.

제 4 조 (회사의 의무)
회사는 관련 법령과 이 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며, 계속적이고 안정적으로 서비스를 제공하기 위해 최선을 다합니다.

제 5 조 (회원의 의무)
회원은 다음 행위를 하여서는 안 됩니다.
1. 타인의 정보 도용
2. 회사가 게시한 정보의 변경
3. 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등)의 송신 또는 게시`
    },
    privacy: {
      title: '개인정보 처리방침',
      body: `태드스마트견적(이하 "회사")은 고객님의 개인정보를 소중하게 생각하며, "개인정보 보호법" 등 관련 법령을 준수하고 있습니다.

1. 수집하는 개인정보 항목
회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.
- 필수항목: 이메일, 프로필 이름, 사진, 영상 데이터
- 유료 결제 시: 카드 정보, 가상계좌 정보 등

2. 개인정보의 수집 및 이용 목적
- 서비스 제공 및 콘텐츠 제작 (영상 병합 등)
- 이용자 식별 및 본인 확인
- 유료 서비스 결제 처리 및 정산
- 고객 상담 및 민원 처리

3. 개인정보의 보유 및 이용 기간
회사는 회원이 탈퇴하거나 서비스가 종료될 때까지 개인정보를 보유합니다. 단, 관련 법령에 따라 보관이 필요한 경우 해당 기간까지 보관합니다.

4. 영상 데이터의 처리
사용자가 업로드한 영상 데이터는 오직 사용자의 "영상 제작" 목적으로만 사용되며, 회사는 이를 외부에 유출하거나 다른 목적으로 활용하지 않습니다.

5. 이용자의 권리
회원은 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 수집 및 이용에 대한 동의 철회 또는 해지를 요청할 수 있습니다.`
    }
  };

  const active = content[type] || content.terms;

  return (
    <div className="container fade-in" style={{ padding: '6rem 2rem', maxWidth: '900px', lineHeight: '1.8' }}>
      <div className="glass-panel" style={{ padding: '3rem', borderRadius: '24px' }}>
        <h1 style={{ marginBottom: '2.5rem', color: 'var(--color-primary-peach)', fontSize: '2rem', fontWeight: '800' }}>
          {active.title}
        </h1>
        <div style={{ color: '#555', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
          {active.body}
        </div>
      </div>
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button className="btn btn-outline" onClick={() => window.history.back()}>뒤로 가기</button>
      </div>
    </div>
  );
}

export default Legal;
