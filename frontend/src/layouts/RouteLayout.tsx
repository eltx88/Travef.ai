import { Outlet } from "react-router-dom";
function RouteLayout() {
  return (
    <div>
        <Outlet />
    </div>
  );
}

export default RouteLayout;