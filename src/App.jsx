import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./page/login";
import RegisterPage from "./page/register";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Dashboard from "./page/dashboard";
import ProductPage from "./page/product"; // Changed from ProdukScreen
import ProductAddPage from "./page/productAdd"; // New import
// import { Auth } from "./components/auth";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/product" element={<ProductPage />} /> {/* Use ProductPage */}
          <Route path="/product/add" element={<ProductAddPage />} />
          <Route path="/product/edit/:productId" element={<ProductAddPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

export default App;