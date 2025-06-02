import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./page/login";
import RegisterPage from "./page/register";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Dashboard from "./page/dashboard";
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;
