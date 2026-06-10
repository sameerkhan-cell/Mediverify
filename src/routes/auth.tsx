import { createFileRoute, Outlet } from "@tanstack/react-router";

// Parent layout route for all /auth/* pages
export const Route = createFileRoute("/auth")({
  component: () => <Outlet />,
});
