import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header/Header";
import Banner from "./components/Banner/Banner";
import ProductList from "./components/Products/ProductList";
import Footer from "./components/Footer/Footer";
import DetailProduct from "./components/Products/DetailProduct";
import Cart from "./components/Products/Cart";
import About from "./components/Pages/About";
import News from "./components/Pages/News";
import "./App.css";

const AppContent = () => {
  const location = useLocation();
  const hideChrome = location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/ForgotPassword" || location.pathname.startsWith("/admin");

  return (
    <>
      {!hideChrome && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Banner />
              <ProductList category="all" />
            </>
          }
        />
        <Route path="/cart" element={<Cart />} />
        <Route path="/product/:id" element={<DetailProduct />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />

        {/* <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} /> */}

        {/* <Route path="/admin" element={<Admin />} />
        <Route path="/admin/bill" element={<Admin />} />
        <Route path="/admin/category" element={<Admin />} />
        <Route path="/admin/customer" element={<Admin />} />
        <Route path="/admin/employee" element={<Admin />} />
        <Route path="/admin/invoicedetails" element={<Admin />} />
        <Route path="/admin/product" element={<Admin />} /> */}
      </Routes>
      {!hideChrome && <Footer />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
