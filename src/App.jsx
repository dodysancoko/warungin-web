import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import LoginPage from "./page/login";
import RegisterPage from "./page/register";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Dashboard from "./page/dashboard";
import ProdukScreen from "./page/product";
// import { Auth } from "./components/auth";

function App() {
  // return (
  //   <div className="App">
  //     <Auth />
  //   </div>
  // );
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/product" element={<ProdukScreen />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;
