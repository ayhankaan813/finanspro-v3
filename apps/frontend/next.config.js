/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@shared"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-separator",
      "@radix-ui/react-switch",
      "@radix-ui/react-toast",
      "@radix-ui/react-visually-hidden",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "framer-motion",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@dnd-kit/modifiers",
      "cmdk",
      "react-day-picker",
      "react-hook-form",
      "@hookform/resolvers",
      "zod",
    ],
  },
};

module.exports = nextConfig;
