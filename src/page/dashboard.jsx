import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/sidebar";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Current User:", currentUser);
      if (currentUser) {
        await currentUser.reload();
        console.log("Current User after reload:", currentUser);

        setUser(currentUser);

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username);
        }
      } else {
        console.log("User tidak terautentikasi, redirect ke login");
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen w-screen flex bg-gray-100 text-gray-800">
      <Sidebar className="w-1/5" />
      <div className="flex-1 p-10 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        {user && (
          <>
            <p className="mb-2">Halo, {username || user.email}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
