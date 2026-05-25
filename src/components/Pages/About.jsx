import React from 'react';
import './About.css';

const About = () => {
    return (
        <div class="about-wrap">
        <section class="shop-intro">
            <h2>VỀ TƯƠI FRUIT</h2>
            <div class="intro-text">
                <p>
                    <strong>TƯƠI Fruit</strong> là cửa hàng chuyên cung cấp trái cây tươi sạch,
                    nông sản chất lượng cao. Chúng tôi cam kết mang đến sản phẩm an toàn,
                    tươi ngon và giá hợp lý nhất cho mọi gia đình Việt.
                </p>
            </div>
        </section>

        <section class="mission-values">
            <div class="mission-item">
                <h3><i class="bi bi-rocket-takeoff"></i> SỨ MỆNH</h3>
                <p>"Mang thực phẩm sạch đến mọi nhà"</p>
            </div>
            <div class="mission-item">
                <h3><i class="bi bi-gem"></i> GIÁ TRỊ</h3>
                <p>"Tươi - Rẻ - An toàn - Nhanh chóng"</p>
            </div>
        </section>

        <section class="why-choose-us">
            <h3>VÌ SAO CHỌN CHÚNG TÔI</h3>
            <div class="reasons-grid">
                <div class="reason-card">
                    <div class="icon-box"><i class="bi bi-flower1"></i></div>
                    <h5>Tươi ngon</h5>
                    <p>Trái cây nhập mới mỗi ngày, đảm bảo độ chín cây tự nhiên.</p>
                </div>
                <div class="reason-card">
                    <div class="icon-box"><i class="bi bi-shield-check"></i></div>
                    <h5>An toàn</h5>
                    <p>Sản phẩm đạt chuẩn sạch, không hóa chất bảo quản.</p>
                </div>
                <div class="reason-card">
                    <div class="icon-box"><i class="bi bi-tag"></i></div>
                    <h5>Giá hợp lý</h5>
                    <p>Cam kết mức giá cạnh tranh đi kèm chất lượng nông sản cao cấp.</p>
                </div>
                <div class="reason-card">
                    <div class="icon-box"><i class="bi bi-lightning-charge"></i></div>
                    <h5>Giao nhanh</h5>
                    <p>Dịch vụ vận chuyển chuyên nghiệp, bảo toàn độ tươi mới.</p>
                </div>
            </div>
        </section>
    </div>
    );
};

export default About;