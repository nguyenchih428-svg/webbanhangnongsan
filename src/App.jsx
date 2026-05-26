import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Banner from './components/Banner/Banner';
import ProductList from './components/Products/ProductList';
import DetailProduct from './components/Products/DetailProduct';
import Cart from './components/Products/Cart';
import Login from './components/Pages/Login';
import Signup from './components/Pages/Signup';
import Profile from './components/Pages/Profile';
import About from './components/Pages/About';
import News from './components/Pages/News';
import Contact from './components/Pages/Contact';
import Admin from './components/Admin/Admin';
import './App.css';

const HomePage = () => (
  <>
    <Banner />
    <ProductList />
  </>
);

function App() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const hideChrome =
    path === '/login' ||
    path === '/signup' ||
    path === '/forgotpassword' ||
    path === '/admin' ||
    path.startsWith('/admin/');

  return (
    <>
      {!hideChrome && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<HomePage />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/product/:id" element={<DetailProduct />} />

        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/rau-cu" element={<HomePage />} />
        <Route path="/rau-cu/*" element={<HomePage />} />
        <Route path="/trai-cay" element={<HomePage />} />
        <Route path="/trai-cay/*" element={<HomePage />} />

        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/bill" element={<Admin />} />
        <Route path="/admin/category" element={<Admin />} />
        <Route path="/admin/customer" element={<Admin />} />
        <Route path="/admin/employee" element={<Admin />} />
        <Route path="/admin/invoicedetails" element={<Admin />} />
        <Route path="/admin/product" element={<Admin />} />
      </Routes>
      {!hideChrome && <Footer />}
    </>
  );
}

export default App;
