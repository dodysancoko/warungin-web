import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const [userCredential, setUserCredential] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const docRef = doc(db, "usernames", username);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError("Username tidak ditemukan");
        toast.error("Username tidak ditemukan");
        return;
      }
      const email = docSnap.data().email;

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Login berhasil:", userCredential.user);
      toast.success("Login berhasil!");
      //navigate("/dashboard");

      setUserCredential(userCredential);
    } catch (error) {
      console.error("Gagal login:", error.message);
      setError(error.message);
      toast.error("Gagal login: " + error.message);
    }
  };

  useEffect(() => {
    if (userCredential) {
      console.log("Navigasi ke dashboard...");
      navigate("/dashboard");
    }
  }, [userCredential, navigate]);
  return (
    <div className="min-h-screen text-white flex w-screen overflow-x-hidden">
      {/* Left Panel */}
      <div className="w-1/2 left-panel bg-gradient-to-b from-[#00A6F4] via-[#B8E6FE] to-[#00A6F4] flex flex-col justify-center items-center text-white">
        <div className="text-center">
          <h1 className="text-[40px] poppins-semibold leading-tight">
            Kelola Warungmu
            <br />
            Lebih Cerdas
          </h1>
        </div>
        <div className="w-[565px] h-[300px] mt-10">
          <img
            src="/warungin-start.png"
            alt="Warungin Product"
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>
        <p className="text-[18px] poppins-medium text-center mt-10 mb-10">
          Catat penjualan, kelola stok, dan
          <br />
          laporan keuangan dengan mudah!
        </p>
        <div className="flex items-center gap-2">
          <div className="w-[89px] h-[50px]">
            <img
              src="/warungin-logo.png"
              alt="Warungin Icon"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <h2 className="poppins-medium text-white text-[32px] leading-[48px] tracking-[-0.03em] drop-shadow-md">
            Warungin
          </h2>
        </div>
      </div>
      {/* Right Panel */}
      <div className="w-1/2 flex flex-col justify-center items-center bg-white">
        <h2 className="text-4xl poppins-semibold text-gray-800">
          Selamat Datang!
        </h2>
        <p className="text-xl poppins-medium text-gray-500 mt-2">
          Masuk ke dalam akunmu
        </p>
        <div className="mt-10 w-1/2">
          <div className="mb-4">
            <label className="block text-gray-700 text-l poppins-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-l poppins-medium mb-2">
              Kata sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-md"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm font-medium mt-2">{error}</p>
          )}
          <a
            href="#"
            className="text-blue-500 text-l poppins-medium underline mb-4 block text-right"
          >
            Lupa kata sandi?
          </a>
          <button
            onClick={handleLogin}
            className="w-full bg-[#00A6F4] text-white p-3 rounded-[24px] text-xl poppins-semibold mb-4 mt-6"
          >
            Masuk
          </button>
          <p className="text-center text-gray-500 text-[17px]">
            atau masuk dengan
          </p>
          <div className="flex justify-center mt-4 space-x-4">
            <div className="relative rounded-full flex items-center justify-center">
              <img
                src="/fb.png"
                alt="Facebook"
                className="w-[33.6px] h-[33.6px]"
              />
            </div>
            <div className="relative rounded-full flex items-center justify-center">
              <img
                src="/google.png"
                alt="Google"
                className="w-[32px] h-[32px]"
              />
            </div>
          </div>
          <p className="text-center text-gray-500 text-[17px] mt-10">
            Tidak memiliki akun?{" "}
            <Link to="/register" className="text-[0084D1] underline">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
