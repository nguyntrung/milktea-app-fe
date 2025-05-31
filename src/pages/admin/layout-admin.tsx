import { Outlet } from "react-router";
import Sidebar from "@/components/sidebar";

export default function LayoutAdmin() {
  return (
    <div className="flex flex-1 max-w-[1200px] mx-auto mt-5">
      <section>
        <Sidebar />
      </section>
      <section className="flex-1 px-4">
        <Outlet />
      </section>
    </div>
  );
}
