// src/App.jsx
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./page/login";
import RegisterPage from "./page/register";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Dashboard from "./page/dashboard";
import ProductPage from "./page/product";
// import ProductAddPage from "./page/productAdd"; // HAPUS IMPORT INI
import CashierPage from "./page/CashierPage";
import FinancePage from "./page/FinancePage";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/product" element={<ProductPage />} />
          {/* --- HAPUS ROUTE BERIKUT --- */}
          {/* <Route path="/product/add" element={<ProductAddPage />} /> */}
          {/* <Route path="/product/edit/:productId" element={<ProductAddPage />} /> */}
          <Route path="/cashier" element={<CashierPage />} />
          <Route path="/finance" element={<FinancePage />} /> 
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

export default App;