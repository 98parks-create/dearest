import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content container">
        <div className="footer-info">
          <Link to="/" className="footer-logo">Dearest</Link>
          <p className="footer-tagline">아이의 모든 순간이 영화가 되는 곳</p>
        </div>
        
        <div className="footer-details">
          <div className="detail-row">
            <span className="brand-emphasis">Dearest (디아레스트)</span>
            <span className="corp-sub">운영: 태드스마트견적</span>
            <span>대표: 박인서</span>
          </div>
          <div className="detail-row">
            <span>사업자등록번호: 387-14-02824</span>
            <span>주소: 성남시 수정구 산성대로 305</span>
          </div>
          <div className="detail-row footer-contact">
            <span>고객센터: 98parks@gmail.com</span>
            <span>운영시간: 평일 10:00 - 18:00 (주말/공휴일 휴무)</span>
          </div>
          
          <div className="footer-links">
            <Link to="/legal/terms">이용약관</Link>
            <Link to="/legal/privacy" className="bold">개인정보처리방침</Link>
          </div>
          
          <p className="footer-copy">© 2026 Dearest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
