import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

// 1. Pixiv Icon (Simple Icons 版本)
export const PixivIcon: React.FC<IconProps> = ({
  size = 24,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={`fill-current ${className || ""}`}
    {...props}
  >
    <path d="M4.94 0A4.953 4.953 0 0 0 0 4.94v14.12A4.953 4.953 0 0 0 4.94 24h14.12A4.953 4.953 0 0 0 24 19.06c-.014 1.355 0-14.12 0-14.12A4.953 4.953 0 0 0 19.06 0Zm1.783 5.465h.904a.37.37 0 0 1 .31.17l.752 1.17a6.172 6.172 0 0 1 10.01 4.834 6.172 6.172 0 0 1-9.394 5.265v2.016a.37.37 0 0 1-.37.367H6.724a.37.37 0 0 1-.37-.367V5.834a.37.37 0 0 1 .37-.37m5.804 2.951a3.222 3.222 0 1 0-.002 6.443 3.222 3.222 0 0 0 .002-6.443" />
  </svg>
);

// 2. Facebook Icon (Simple Icons 版本)
export const FacebookIcon: React.FC<IconProps> = ({
  size = 24,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={`fill-current ${className || ""}`}
    {...props}
  >
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
  </svg>
);

// 3. X Icon (Simple Icons 版本)
export const XIcon: React.FC<IconProps> = ({
  size = 24,
  className,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={`fill-current ${className || ""}`}
    {...props}
  >
    <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
  </svg>
);
