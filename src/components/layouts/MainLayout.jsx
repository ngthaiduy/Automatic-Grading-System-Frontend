import { Layout, Button, Menu, ConfigProvider } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import styles from "./MainLayout.module.css";
import logoImg from "../../assets/agsfjope-logo.png";
import NotificationBell from "../notifications/NotificationBell";
import { useAuth } from "../../app/context/authContext";
import { sidebarItemsWithMaterialIcons } from "../utils/Utils";
import { ROLE_HOME_MAP } from "../../constants/routes";
import axiosClient from "../../services/axiosClient";

const { Header, Content, Sider } = Layout;

const siderStyle = {
  overflow: "hidden",
  height: "100vh",
  minHeight: "100vh",
  position: "fixed",
  insetInlineStart: 0,
  top: 0,
  zIndex: 30,
  flex: "0 0 auto",
};

const ROLE_LABELS = {
  SYSTEM_ADMIN: "Quản trị",
  ADMIN: "Quản trị",
  EXAM_STAFF: "Khảo thí",
  STAFF: "Khảo thí",
  LECTURER: "Giảng viên",
  TEACHER: "Giảng viên",
  STUDENT: "Sinh viên",
};

const normalizeRole = (role) =>
  typeof role === "string" ? role.trim().toUpperCase() : "";

const EXPANDED_SIDER_WIDTH = 240;
const COLLAPSED_SIDER_WIDTH = 80;

const MainLayout = ({ children, siderItems, siderIcons, actionBtn = null }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const headerDropdownRef = useRef(null);
  const currentSiderWidth = collapsed
    ? COLLAPSED_SIDER_WIDTH
    : EXPANDED_SIDER_WIDTH;

  const shellStyle = useMemo(
    () => ({
      minWidth: 0,
      minHeight: "100dvh",
      overflowX: "hidden",
      position: "relative",
      marginLeft: currentSiderWidth,
      width: `calc(100% - ${currentSiderWidth}px)`,
    }),
    [currentSiderWidth],
  );

  const { user, logout } = useAuth();

  const roleKey = normalizeRole(user?.roleName ?? user?.role);
  const roleLabel = roleKey ? (ROLE_LABELS[roleKey] ?? roleKey) : "Người dùng";
  const userDisplay = user?.fullName ?? user?.username ?? "Người dùng";
  const userSubText = user?.email ?? user?.username ?? roleLabel;
  const avatarInitials = useMemo(() => {
    const baseName = String(userDisplay || "").trim();

    if (!baseName) return "?";

    const parts = baseName.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    }

    return baseName.slice(0, 2).toUpperCase();
  }, [userDisplay]);

  const avatarImageUrl =
    typeof user?.avatarUrl === "string" && user.avatarUrl.trim()
      ? user.avatarUrl.trim()
      : "";

  const avatarStyle = avatarImageUrl
    ? {
        backgroundImage: `url("${avatarImageUrl}")`,
      }
    : undefined;

  const profileMenuPath = ROLE_HOME_MAP[roleKey] || "/";

  const menuItems = useMemo(() => {
    const items =
      typeof siderItems === "function" ? siderItems({ collapsed }) : siderItems;

    const attachLink = (item) => ({
      ...item,
      label: item.to ? <Link to={item.to}>{item.label}</Link> : item.label,
      children: item.children ? item.children.map(attachLink) : undefined,
    });

    const hasChildren = items.some((item) => item.children != null);

    const baseItems = hasChildren
      ? sidebarItemsWithMaterialIcons({ icons: siderIcons, items })
      : items.map((item, index) => ({ ...item, icon: siderIcons[index] }));

    return baseItems.map(attachLink);
  }, [collapsed, siderItems, siderIcons]);

  // Find the best matching sidebar key using longest-prefix matching
  // so that sub-pages (e.g. /exam-staff/exams/123/blocks/456) still highlight
  // their parent menu item (/exam-staff/exams).
  const selectedKey = useMemo(() => {
    const pathname = location.pathname;
    let bestKey = "1"; // fallback: dashboard
    let bestMatchLength = 0;

    const walk = (items) => {
      for (const item of items) {
        if (item.to) {
          const to = String(item.to);
          // Must be exact match OR pathname starts with `to + '/'`
          if (pathname === to || pathname.startsWith(to + "/")) {
            if (to.length > bestMatchLength) {
              bestMatchLength = to.length;
              bestKey = String(item.key);
            }
          }
        }
        if (item.children) walk(item.children);
      }
    };

    walk(menuItems);
    return bestKey;
  }, [menuItems, location.pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        headerDropdownRef.current &&
        !headerDropdownRef.current.contains(e.target)
      ) {
        setHeaderDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setHeaderDropdownOpen(false);

    try {
      // Backend: POST /api/auth/logout
      // axiosClient đã tự gắn Authorization: Bearer <token>
      await axiosClient.post("/auth/logout");
    } catch (error) {
      // Dù backend logout lỗi thì vẫn xóa session local để tránh user bị kẹt
      console.error("Logout API failed:", error);
    } finally {
      logout(); // xóa token + user trong AuthContext hiện tại
      // Cookie HttpOnly sẽ bị backend tự động xóa khi gọi API logout
      navigate("/login", { replace: true });
      setLoggingOut(false);
    }
  }, [loggingOut, logout, navigate]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemColor: "#CBD5E1",
            itemSelectedColor: "#F37021",
            itemSelectedBg: "#291D1A",
            itemHoverBg: "rgba(255, 255, 255, 0.1)",
            itemHoverColor: "#ffffff",
            collapsedWidth: 10,
            groupTitleColor: "#A1A1AA",
            collapsedIconSize: 20,
          },
          Layout: {
            siderBg: "#2D2D2D",
          },
          Button: {
            colorPrimaryHover: "#F37021E6",
            colorPrimaryActive: "#D95F19",
          },
        },
      }}
    >
      <Layout className={styles.layout}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={EXPANDED_SIDER_WIDTH}
          collapsedWidth={COLLAPSED_SIDER_WIDTH}
          style={siderStyle}
        >
          <div className={styles.siderInner}>
            {!collapsed ? (
              <div className={styles.logoWrapper}>
                <img src={logoImg} alt="Logo" className={styles.logo} />
                <div className={collapsed ? styles.fadeOut : styles.fadeIn}>
                  <h1 className="font-bold">Chấm bài OOP</h1>
                  <p>{roleLabel}</p>
                </div>
              </div>
            ) : (
              <img src={logoImg} alt="Logo" className={styles.logoCollapsed} />
            )}

            <div className={styles.siderDivider} />

            <div className={styles.menuWrap}>
              <Menu
                selectedKeys={[selectedKey]}
                items={menuItems}
                className={styles.menu}
                mode="inline"
              />
            </div>

            {actionBtn && (
              <div className={styles.actionArea}>
                <div className={styles.actionDivider} />
                {typeof actionBtn === "function"
                  ? actionBtn({ collapsed })
                  : actionBtn}
              </div>
            )}
          </div>
        </Sider>

        <Layout style={shellStyle} className={styles.shell}>
          <Header
            className={`${styles.header} border-b border-slate-200`}
            style={{
              position: "sticky",
              top: 0,
              zIndex: 100,
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 36,
                height: 36,
                position: "relative",
                left: 32,
              }}
            />

            <div className={styles.uti}>
              <NotificationBell
                buttonClassName="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-[#F37021] hover:bg-[#fff7f2] shadow-none"
                iconClassName="h-4 w-4"
              />

              <div className={styles.divider} />

              <div
                className="flex items-center gap-3 pl-6 relative"
                ref={headerDropdownRef}
              >
                <button
                  onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                  className="flex items-center gap-3 group"
                  type="button"
                >
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 leading-none">
                      {userDisplay}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium leading-4">
                      {userSubText}
                    </p>
                  </div>

                  <div
                    className={`aspect-square w-10 rounded-full ring-2 transition-all cursor-pointer overflow-hidden flex items-center justify-center text-xs font-black uppercase bg-cover bg-center bg-no-repeat ${
                      avatarImageUrl
                        ? "bg-slate-200 text-transparent"
                        : "bg-[#F37021]/15 text-[#F37021]"
                    } ${headerDropdownOpen ? "ring-[#F37021]" : "ring-[#F37021]/20 group-hover:ring-[#F37021]/50"}`}
                    style={avatarStyle}
                    aria-hidden="true"
                  >
                    {!avatarImageUrl ? avatarInitials : null}
                  </div>
                </button>

                {headerDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-1 z-[110]">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800">
                        {userDisplay}
                      </p>
                      <p className="text-xs text-slate-400">{userSubText}</p>
                    </div>

                    <Link
                      to={profileMenuPath}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-400">
                        person
                      </span>
                      Trang chính
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        logout
                      </span>
                      {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Header>

          <Content className={styles.content}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
