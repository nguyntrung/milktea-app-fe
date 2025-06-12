import { useState, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Header from "./components/header";
import Footer from "./components/footer";
import { Toaster } from "./components/ui/sonner";
import LazyWrapper from "./components/common/LazyWrapper";
import ProtectedRoute from "./components/protected-route";
import { lazyImport } from "./lib/utils";
import Promotions from "./pages/admin/promotions/promotions";

// 🌐 Web pages
const HomePage = lazyImport(() => import("./pages/web/home-page/home-page"));
const ProductList = lazyImport(() => import("./pages/web/product-list/product-list"));
const ProductDetail = lazyImport(() => import("./pages/web/product-list/product-detail"));
const MyCart = lazyImport(() => import("./pages/web/my-cart/my-cart"));
const Checkout = lazyImport(() => import("./pages/web/checkout/checkout"));
const OrderSuccess = lazyImport(() => import("./pages/web/order-success/order-success"));
const OrdersW = lazyImport(() => import("./pages/web/orders/orders"));
const OrderDetail = lazyImport(() => import("./pages/web/orders/order-detail"));
const Profile = lazyImport(() => import("./pages/web/profile/profile"));
const Notification = lazyImport(() => import("./pages/web/notification/notification"));

// 🔐 Auth
const SignIn = lazyImport(() => import("./pages/auth/sign-in"));
const UnauthorizedPage = lazyImport(() => import("./components/unauthorized"));

// 🛠 Admin layout
const LayoutAdmin = lazyImport(() => import("./pages/admin/layout-admin"));

// 🧾 Admin pages
const Statistic = lazyImport(() => import("./pages/admin/statistic/statistic"));
const Categories = lazyImport(() => import("./pages/admin/categories/categories"));
const Orders = lazyImport(() => import("./pages/admin/orders/orders"));
const OrderDetailManage = lazyImport(() => import("./pages/admin/orders/order-detail"));
const Products = lazyImport(() => import("./pages/admin/products/products"));
const ProductAdd = lazyImport(() => import("./pages/admin/products/product-add"));
const SuppliersPage = lazyImport(() => import("./pages/admin/suppliers/suppliers"));
const ToppingsPage = lazyImport(() => import("./pages/admin/toppings/toppings"));
const IngredientsPage = lazyImport(() => import("./pages/admin/ingredients/ingredients"));
const OrderIngredientsPage = lazyImport(() => import("./pages/admin/order-ingredients/order-ingredients"));
const Warehouse = lazyImport(() => import("./pages/admin/warehouse/warehouse"));
const Design = lazyImport(() => import("./pages/admin/design/design"));
// const Marketing = lazyImport(() => import("./pages/admin/marketing/marketing"));
const StoreSetting = lazyImport(() => import("./pages/admin/store-setting/store-setting"));
const Users = lazyImport(() => import("./pages/admin/users/users"));

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    if (token) {
      setIsLoggedIn(true);
      setIsAdmin(userRole === "admin" || userRole === "shipper" || userRole === "employee" || userRole === "nhan-vien-kho");
    }
    setIsLoading(false);
  }, []);

  const getRedirectPathByRole = () => {
    const role = localStorage.getItem("role");

    switch (role) {
      case "admin":
        return "/admin";
      case "employee":
      case "shipper":
        return "/admin/orders";
      case "nhan-vien-kho":
        return "/admin/order-ingredients";
      default:
        return "/";
    }
  };

  if (isLoading) return <div></div>;

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Toaster />
        <Header
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
        />
        <div className="flex flex-1">
          <main className={isAdmin ? "ml-64 flex-1" : "flex-1"} style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <Routes>
              {/* Auth */}
              <Route
                path="/sign-in"
                element={
                  isLoggedIn ? (
                    <Navigate to={getRedirectPathByRole()} />
                  ) : (
                    <LazyWrapper>
                      <SignIn setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
                    </LazyWrapper>
                  )
                }
              />

              {/* Unauthorized page */}
              <Route 
                path="/unauthorized" 
                element={
                  <LazyWrapper>
                    <UnauthorizedPage />
                  </LazyWrapper>
                } 
              />

              {/* Public routes */}
              <Route path="/" element={<LazyWrapper><HomePage /></LazyWrapper>} />
              <Route path="/products" element={<LazyWrapper><ProductList /></LazyWrapper>} />
              <Route path="/products/:id" element={<LazyWrapper><ProductDetail /></LazyWrapper>} />
              <Route path="/cart" element={<LazyWrapper><MyCart /></LazyWrapper>} />
              <Route path="/checkout" element={<LazyWrapper><Checkout /></LazyWrapper>} />
              <Route path="/order-success" element={<LazyWrapper><OrderSuccess /></LazyWrapper>} />
              <Route path="/orders" element={<LazyWrapper><OrdersW /></LazyWrapper>} />
              <Route path="/order-details/:id" element={<LazyWrapper><OrderDetail /></LazyWrapper>} />
              <Route path="/profile" element={<LazyWrapper><Profile /></LazyWrapper>} />
              <Route path="/notification" element={<LazyWrapper><Notification /></LazyWrapper>} />

              {/* Protected Admin routes */}
              <Route path="/admin/*" element={<ProtectedRoute requiredPath="/admin"><LazyWrapper><LayoutAdmin /></LazyWrapper></ProtectedRoute>}>
                <Route index element={<LazyWrapper><Statistic /></LazyWrapper>} />
                <Route path="categories" element={<ProtectedRoute requiredPath="/admin/categories"><LazyWrapper><Categories /></LazyWrapper></ProtectedRoute>} />
                <Route path="orders" element={<ProtectedRoute requiredPath="/admin/orders"><LazyWrapper><Orders /></LazyWrapper></ProtectedRoute>} />
                <Route path="orders/:id" element={<ProtectedRoute requiredPath="/admin/orders"><LazyWrapper><OrderDetailManage /></LazyWrapper></ProtectedRoute>} />
                <Route path="products" element={<ProtectedRoute requiredPath="/admin/products"><LazyWrapper><Products /></LazyWrapper></ProtectedRoute>} />
                <Route path="products/add" element={<ProtectedRoute requiredPath="/admin/products"><LazyWrapper><ProductAdd /></LazyWrapper></ProtectedRoute>} />
                <Route path="products/edit/:id" element={<ProtectedRoute requiredPath="/admin/products"><LazyWrapper><ProductAdd /></LazyWrapper></ProtectedRoute>} />
                <Route path="suppliers" element={<ProtectedRoute requiredPath="/admin/suppliers"><LazyWrapper><SuppliersPage /></LazyWrapper></ProtectedRoute>} />
                <Route path="toppings" element={<ProtectedRoute requiredPath="/admin/toppings"><LazyWrapper><ToppingsPage /></LazyWrapper></ProtectedRoute>} />
                <Route path="ingredients" element={<ProtectedRoute requiredPath="/admin/ingredients"><LazyWrapper><IngredientsPage /></LazyWrapper></ProtectedRoute>} />
                <Route path="warehouse" element={<ProtectedRoute requiredPath="/admin/warehouse"><LazyWrapper><Warehouse /></LazyWrapper></ProtectedRoute>} />
                <Route path="order-ingredients" element={<ProtectedRoute requiredPath="/admin/order-ingredients"><LazyWrapper><OrderIngredientsPage /></LazyWrapper></ProtectedRoute>} />
                <Route path="design" element={<ProtectedRoute requiredPath="/admin/design"><LazyWrapper><Design /></LazyWrapper></ProtectedRoute>} />
                {/* <Route path="marketing" element={<ProtectedRoute requiredPath="/admin/marketing"><LazyWrapper><Marketing /></LazyWrapper></ProtectedRoute>} /> */}
                <Route path="store-setting" element={<ProtectedRoute requiredPath="/admin/store-setting"><LazyWrapper><StoreSetting /></LazyWrapper></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute requiredPath="/admin/users"><LazyWrapper><Users /></LazyWrapper></ProtectedRoute>} />
                <Route path="marketing" element={<ProtectedRoute requiredPath="/admin/marketing"><LazyWrapper><Promotions /></LazyWrapper></ProtectedRoute>} />
              </Route>

              {/* Catch all route - redirect to unauthorized */}
              <Route path="*" element={<Navigate to="/unauthorized" replace />} />
            </Routes>
          </main>
        </div>
        <div className="bg-primary">
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
