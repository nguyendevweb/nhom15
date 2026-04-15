"use client";

import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.links}>
          <div className={styles.section}>
            <h4>About</h4>
            <ul>
              <li><a href="#">About MinLish</a></li>
              <li><a href="#">How Quizlet works</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Advertise with us</a></li>
            </ul>
          </div>
          <div className={styles.section}>
            <h4>Study tools</h4>
            <ul>
              <li><a href="#">Flashcards</a></li>
              <li><a href="#">Test</a></li>
              <li><a href="#">Learn</a></li>
              <li><a href="#">Study groups</a></li>
            </ul>
          </div>
          <div className={styles.section}>
            <h4>Apps</h4>
            <ul>
              <li><a href="#">Download iOS app</a></li>
              <li><a href="#">Download Android app</a></li>
            </ul>
          </div>
          <div className={styles.section}>
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help center</a></li>
              <li><a href="#">Honor code</a></li>
              <li><a href="#">Community guidelines</a></li>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.social}>
            <a href="#" aria-label="TikTok">📱</a>
            <a href="#" aria-label="X">🐦</a>
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="YouTube">📺</a>
            <a href="#" aria-label="LinkedIn">💼</a>
          </div>
          <div className={styles.country}>
            <select>
              <option>United States</option>
              <option>Canada</option>
              <option>United Kingdom</option>
              <option>Australia</option>
              {/* Thêm tùy chọn nếu cần */}
            </select>
          </div>
          <div className={styles.copyright}>
            © 2026 MinLish, Inc.
          </div>
        </div>
      </div>
    </footer>
  );
}