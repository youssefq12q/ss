import React from "react";
import {
  Menu,
  ShoppingBag,
  Search,
  Heart,
  User,
  Sparkles,
  ShieldCheck,
  Database,
  Truck,
} from "lucide-react";
import { UserProfile } from "../types";

import UserProfileDropdown from "./UserProfileDropdown";
import UserAvatar from "./UserAvatar";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  openSearch: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onUpdateUser: (profile: UserProfile) => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  cartCount,
  openSearch,
  user,
  onOpenAuth,
  onLogout,
  onUpdateUser,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
        isScrolled
          ? "bg-[#fff8f3]/95 backdrop-blur-md shadow-sm py-3 border-brand-outline-variant/30"
          : "bg-[#fff8f3]/85 backdrop-blur-sm py-4 border-transparent"
      }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Left: Hamburger menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("shop")}
            className="text-brand-gold hover:opacity-70 transition-opacity active:scale-95 duration-200"
            aria-label="Menu">
            <Menu className="w-5 h-5 stroke-[1.5]" />
          </button>

          <nav className="hidden lg:flex items-center gap-8 text-xs font-medium tracking-[0.15em] uppercase text-brand-outline">
            <button
              onClick={() => setActiveTab("home")}
              className={`hover:text-brand-gold transition-colors ${
                activeTab === "home" ? "text-brand-gold font-semibold" : ""
              }`}>
              Home
            </button>
            <button
              onClick={() => setActiveTab("shop")}
              className={`hover:text-brand-gold transition-colors ${
                activeTab === "shop" ? "text-brand-gold font-semibold" : ""
              }`}>
              Shop All
            </button>

            {user?.email?.toLowerCase() === "vero2026@vero.com" && (
              <button
                onClick={() => setActiveTab("supabase")}
                className={`hover:text-brand-gold transition-colors flex items-center gap-1.5 ${
                  activeTab === "supabase"
                    ? "text-brand-gold font-semibold"
                    : ""
                }`}>
                <Database className="w-3.5 h-3.5 text-brand-gold" />
                <span>Supabase</span>
              </button>
            )}
            {(user?.tier === "Platinum" || user?.tier === "Diamond") && (
              <button
                onClick={() => setActiveTab("platinum-lounge")}
                className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-1 rounded-full shadow-sm hover:from-cyan-500 hover:to-blue-500 transition-all scale-[0.98] ${
                  activeTab === "platinum-lounge" ? "ring-2 ring-cyan-400" : ""
                }`}>
                <Sparkles className="w-3 h-3 text-cyan-200 animate-pulse" />
                <span>Platinum Lounge</span>
              </button>
            )}
            {user?.email?.toLowerCase() === "vero2026@vero.com" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`hover:text-brand-gold transition-colors flex items-center gap-1 ${
                  activeTab === "admin" ? "text-brand-gold font-semibold" : ""
                }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-brand-gold animate-pulse-subtle" />
                <span>Boutique Admin</span>
              </button>
            )}
          </nav>
        </div>

        {/* Center: Brand Name */}
        <button
          onClick={() => setActiveTab("home")}
          className="font-serif text-2xl md:text-3xl tracking-[0.25em] text-brand-gold hover:opacity-80 transition-opacity uppercase font-medium focus:outline-none">
          VERO
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-5 md:gap-7">
          <button
            onClick={openSearch}
            className="hidden md:flex items-center gap-2 text-brand-outline hover:text-brand-gold font-medium tracking-[0.1em] text-xs uppercase transition-colors">
            <Search className="w-4 h-4 stroke-[1.5]" />
            Search
          </button>

          <button
            onClick={openSearch}
            className="flex md:hidden text-brand-gold hover:opacity-70 transition-opacity"
            aria-label="Search">
            <Search className="w-5 h-5 stroke-[1.5]" />
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            className="text-brand-gold hover:opacity-70 transition-opacity relative"
            aria-label="Favorites">
            <Heart className="w-5 h-5 stroke-[1.5]" />
          </button>

          <button
            onClick={() => setActiveTab("bag")}
            className="text-brand-gold hover:opacity-70 transition-opacity relative active:scale-95 duration-200"
            aria-label="Shopping Bag">
            <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-gold text-white text-[9px] flex items-center justify-center rounded-full font-bold animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile / Vault Access */}
          <div className="relative">
            {user ? (
              <button
                id="header-user-profile-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 hover:opacity-85 transition-opacity active:scale-95 duration-200 focus:outline-none"
                aria-label="User Profile">
                <UserAvatar
                  name={user.name}
                  avatar={user.avatar}
                  className="w-7 h-7"
                  tier={user.tier}
                />
                <span className="hidden md:inline text-[9px] tracking-widest font-semibold text-brand-gold uppercase truncate max-w-[80px]">
                  {user.name.split(" ")[0]}
                </span>
              </button>
            ) : (
              <button
                id="header-user-login-btn"
                onClick={onOpenAuth}
                className="text-brand-gold hover:opacity-70 transition-opacity flex items-center gap-1 focus:outline-none active:scale-95 duration-200"
                aria-label="Login Vault">
                <User className="w-5 h-5 stroke-[1.5]" />
              </button>
            )}

            {user && (
              <UserProfileDropdown
                user={user}
                isOpen={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
                onLogout={onLogout}
                onUpdateUser={onUpdateUser}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
