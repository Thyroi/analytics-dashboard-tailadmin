"use client";

import Image from "next/image";
import { useState } from "react";

interface AvatarProps {
  src?: string | null;
  name?: string;
  email?: string;
  size?: number;
  className?: string;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "U";
}

function getColorFromString(str: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-orange-500",
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({
  src,
  name,
  email,
  size = 56,
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name, email);
  const bgColor = getColorFromString(name || email || "");

  if (!src || imageError) {
    return (
      <div
        className={`flex items-center justify-center rounded-full text-white font-semibold ${bgColor} ${className}`}
        style={{ width: size, height: size, fontSize: size / 2.5 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name || email || "Usuario"}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={() => setImageError(true)}
    />
  );
}
