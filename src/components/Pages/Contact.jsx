import React, { useState } from "react";
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSent, setIsSent] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSent(true);
    setFormData({ name: "", email: "", phone: "", message: "" });
    setTimeout(() => setIsSent(false), 3000);
  };

  return (
    <div className="contact-page">
      <div className="contact-container">
        <div className="contact-info">
          <h2 className="contact-heading">Liên hệ với Leaf Fruit</h2>
          <p className="contact-desc">
            Nếu bạn có bất kỳ thắc mắc nào về sản phẩm hoặc cần hỗ trợ, vui lòng để lại lời nhắn. Đội ngũ Leaf Fruit sẽ phản hồi bạn trong thời gian sớm nhất.
          </p>

          <div className="info-list">
            <div className="info-item">
              <i className="bi bi-geo-alt-fill"></i>
              <div>
                <h4>Địa chỉ cửa hàng</h4>
                <p>Ký túc xá Đại học Quốc gia, TP. Thủ Đức</p>
              </div>
            </div>
            <div className="info-item">
              <i className="bi bi-telephone-fill"></i>
              <div>
                <h4>Hotline hỗ trợ</h4>
                <p>034 567 8910</p>
              </div>
            </div>
            <div className="info-item">
              <i className="bi bi-envelope-fill"></i>
              <div>
                <h4>Email liên hệ</h4>
                <p>hello@leaffruit.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-wrap">
          <h3 className="form-title">Gửi tin nhắn cho chúng tôi</h3>
          <form onSubmit={handleSubmit} className="contact-form">
            <input
              type="text"
              name="name"
              placeholder="Họ và tên"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div className="form-row">
              <input
                type="email"
                name="email"
                placeholder="Email liên hệ"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Số điện thoại"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <textarea
              name="message"
              placeholder="Nội dung tin nhắn..."
              className="form-input textarea"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>

            {isSent && <div className="success-msg">Gửi tin nhắn thành công! Chúng tôi sẽ liên hệ lại với bạn sớm nhất.</div>}

            <button type="submit" className="submit-btn">
              Gửi tin nhắn
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;