import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import {
  Layers,
  ReceiptText,
  FileChartColumn,
  LayoutDashboard,
  Settings,
  LogOut,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const sidebarItems = [
  { icon: <LayoutDashboard />, label: "Dashboard", path: "/dashboard" },
  { icon: <Layers />, label: "Produk", path: "/product" },
  { icon: <ReceiptText />, label: "Kasir", path: "/cashier" },
  { icon: <FileChartColumn />, label: "Laporan", path: "/report" },
];

function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path) && pathname !== "/";
  };

  // const handleLogout = () => {
  //   toast.success("Logout successfull, have a nice day!");
  //   localStorage.removeItem("user");
  //   navigate("/login");
  // };

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     const data = localStorage.getItem("user");
  //     if (data) {
  //       setUserData(JSON.parse(data!));
  //     } else {
  //       navigate("/login");
  //     }
  //   }
  // }, []);

  return (
    <aside className="p-6 flex flex-col gap-8 bg-gray-100 text-gray-600 h-screen w-1/5">
      <div className="flex flex-col items-center gap-2">
        <Avatar>
          <AvatarImage
            src="https://github.com/shadcn.png"
            className="rounded-full"
            style={{ width: "68px", height: "68px" }}
          />
          <AvatarFallback>FY</AvatarFallback>
        </Avatar>
        <h2 className="poppins-medium">{userData?.fullname}</h2>
      </div>

      <nav className="flex flex-col h-full justify-between">
        <div className="flex flex-col gap-4">
          {sidebarItems.map((item) => (
            <Link to={item.path} key={item.label}>
              <Button
                variant={"ghost"}
                className={`${
                  isActive(item.path)
                    ? "bg-sky-500 text-white"
                    : "text-gray-600"
                } justify-start gap-4 w-full flex items-center hover:bg-gray-200`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            key={"Logout"}
            variant="ghost"
            className={`justify-start gap-4 w-full flex items-center`}
            //onClick={handleLogout}
          >
            <span>
              <LogOut />
            </span>
            Keluar
          </Button>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
