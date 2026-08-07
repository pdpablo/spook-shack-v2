import React from "react";
import { Outlet } from "react-router-dom";
import SideNav from "./SideNav";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";

export default function Shell() {
  return (
    <div className="min-h-screen bg-background grid-noise">
      <div className="flex">
        <SideNav />
        <div className="flex-1 min-w-0">
          <TopBar />
          <main className="px-5 py-6 pb-24 md:px-10 md:py-9 max-w-[1500px] mx-auto">
            <Outlet />
          </main>
          <MobileNav />
        </div>
      </div>
    </div>
  );
}