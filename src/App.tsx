import { useState, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Header from "./components/header";
import Footer from "./components/footer";
import { Toaster } from "./components/ui/sonner";
import LazyWrapper from "./components/common/LazyWrapper";
import { lazyImport } from "./lib/utils";

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

// 🔐 Auth
const SignIn = lazyImport(() => import("./pages/auth/sign-in"));

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
const Marketing = lazyImport(() => import("./pages/admin/marketing/marketing"));
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
      setIsAdmin(userRole === "admin");
    }
    setIsLoading(false);
  }, []);

  if (isLoading) return <div>Đang tải...</div>;

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
                    <Navigate to={isAdmin ? "/admin" : "/"} />
                  ) : (
                    <LazyWrapper>
                      <SignIn setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
                    </LazyWrapper>
                  )
                }
              />

              {/* Public */}
              <Route path="/" element={<LazyWrapper><HomePage /></LazyWrapper>} />
              <Route path="/products" element={<LazyWrapper><ProductList /></LazyWrapper>} />
              <Route path="/products/:id" element={<LazyWrapper><ProductDetail /></LazyWrapper>} />
              <Route path="/cart" element={<LazyWrapper><MyCart /></LazyWrapper>} />
              <Route path="/checkout" element={<LazyWrapper><Checkout /></LazyWrapper>} />
              <Route path="/order-success" element={<LazyWrapper><OrderSuccess /></LazyWrapper>} />
              <Route path="/orders" element={<LazyWrapper><OrdersW /></LazyWrapper>} />
              <Route path="/order-detail/:id" element={<LazyWrapper><OrderDetail /></LazyWrapper>} />
              <Route path="/profile" element={<LazyWrapper><Profile /></LazyWrapper>} />

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  isLoggedIn && isAdmin ? (
                    <LazyWrapper><LayoutAdmin /></LazyWrapper>
                  ) : (
                    <Navigate to={isLoggedIn ? "/" : "/sign-in"} />
                  )
                }
              >
                <Route index element={<LazyWrapper><Statistic /></LazyWrapper>} />
                <Route path="categories" element={<LazyWrapper><Categories /></LazyWrapper>} />
                <Route path="orders" element={<LazyWrapper><Orders /></LazyWrapper>} />
                <Route path="orders/:id" element={<LazyWrapper><OrderDetailManage /></LazyWrapper>} />
                <Route path="products" element={<LazyWrapper><Products /></LazyWrapper>} />
                <Route path="products/add" element={<LazyWrapper><ProductAdd /></LazyWrapper>} />
                <Route path="products/edit/:id" element={<LazyWrapper><ProductAdd /></LazyWrapper>} />
                <Route path="suppliers" element={<LazyWrapper><SuppliersPage /></LazyWrapper>} />
                <Route path="toppings" element={<LazyWrapper><ToppingsPage /></LazyWrapper>} />
                <Route path="ingredients" element={<LazyWrapper><IngredientsPage /></LazyWrapper>} />
                <Route path="warehouse" element={<LazyWrapper><Warehouse /></LazyWrapper>} />
                <Route path="order-ingredients" element={<LazyWrapper><OrderIngredientsPage /></LazyWrapper>} />
                <Route path="design" element={<LazyWrapper><Design /></LazyWrapper>} />
                <Route path="marketing" element={<LazyWrapper><Marketing /></LazyWrapper>} />
                <Route path="store-setting" element={<LazyWrapper><StoreSetting /></LazyWrapper>} />
                <Route path="users" element={<LazyWrapper><Users /></LazyWrapper>} />
              </Route>
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
