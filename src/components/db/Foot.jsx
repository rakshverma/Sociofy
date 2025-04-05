import React from "react";
import Chatbot from "./Chatbot";
import "./Foot.css"
function Foot() {
  return (
    <footer className="footer">
      <p>© 2025 Sociofy. All rights reserved.</p>
      <div className="footer-links">
        <a href="">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="mailto:iiitsociofydwd@gmail.com">Contact Us</a>
      </div>
      <Chatbot />
    </footer>
  );
}

export default Foot;
