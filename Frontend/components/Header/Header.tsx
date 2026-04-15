"use client";

import styles from "./Header.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/AuthContext";
import { Input, Button, message, Dropdown, Avatar } from "antd";
import { SearchOutlined, PlusOutlined, UserOutlined, LogoutOutlined, SettingOutlined, BorderTopOutlined  } from "@ant-design/icons";
import { useState } from "react";
import UserProfileModal from "../UserProfileModal/UserProfileModal";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  const handleLogout = () => {
    logout();
    message.success("Đăng xuất thành công!");
    router.push("/login");
  };

  const handleProfileClick = () => {
    setIsProfileModalVisible(true);
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: handleProfileClick,
    },
     {
      key: 'dashboard',
      icon: <BorderTopOutlined />,
      label: 'Dashboard',
      onClick: () => {
        router.push("/dashboard");
      },
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => {
        // TODO: Triển khai chức năng cài đặt
        message.info('Chức năng cài đặt sẽ sớm có mặt!');
      },
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={() => router.push("/")}>
        MinLish
      </div>

      <div className={styles.searchContainer}>
        <Input
          placeholder="Search for sets, terms, or classes"
          prefix={<SearchOutlined />}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push("/create")}
          className={styles.createButton}
        >
          Create
        </Button>

        {user ? (
          <div className={styles.userMenu}>
            <span className={styles.welcomeText}>Welcome {user.name}</span>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Avatar
                size="default"
                src={user.avatar || undefined}
                icon={!user.avatar ? <UserOutlined /> : undefined}
                className={styles.userAvatar}
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </div>
        ) : (
          <div className={styles.authButtons}>
            <Button onClick={() => router.push("/login")}>Log in</Button>
            <Button type="primary" onClick={() => router.push("/register")}>
              Sign up
            </Button>
          </div>
        )}
      </div>

      <UserProfileModal
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
      />
    </header>
  );
}