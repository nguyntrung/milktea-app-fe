import { useState, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Header from "./components/header";
import Footer from "./components/footer";
import HomePage from "./pages/web/home-page/home-page";
import Categories from "./pages/admin/categories/categories";
import LayoutAdmin from "./pages/admin/layout-admin";
import Orders from "./pages/admin/orders/orders";
import OrderDetailManage from "./pages/admin/orders/order-detail";
import SignIn from "./pages/auth/sign-in";
import Statistic from "./pages/admin/statistic/statistic";
import Products from "./pages/admin/products/products";
import ProductAdd from "./pages/admin/products/product-add";
import SuppliersPage from "./pages/admin/suppliers/suppliers";
import ToppingsPage from "./pages/admin/toppings/toppings";
import IngredientsPage from "./pages/admin/ingredients/ingredients";
import OrderIngredientsPage from "./pages/admin/order-ingredients/order-ingredients";
import ProductList from "./pages/web/product-list/product-list";
import ProductDetail from "./pages/web/product-list/product-detail";
import MyCart from "./pages/web/my-cart/my-cart";
import Checkout from "./pages/web/checkout/checkout";
import OrderSuccess from "./pages/web/order-success/order-success";
import OrdersW from "./pages/web/orders/orders";
import OrderDetail from "./pages/web/orders/order-detail";
import { Toaster } from "./components/ui/sonner";
import Design from "./pages/admin/design/design";
import Marketing from "./pages/admin/marketing/marketing";
import Profile from "./pages/web/profile/profile";
import Warehouse from "./pages/admin/warehouse/warehouse";
import StoreSetting from "./pages/admin/store-setting/store-setting";

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

  if (isLoading) {
    return <div></div>;
  }

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
          <main
            className={isAdmin ? "ml-64 flex-1" : "flex-1"}
            style={{ maxWidth: "1200px", margin: "0 auto" }}
          >
            <Routes>
              <Route
                path="/sign-in"
                element={
                  isLoggedIn ? (
                    <Navigate to={isAdmin ? "/admin" : "/"} />
                  ) : (
                    <SignIn setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
                  )
                }
              />
              <Route
                path="/sign-in"
                element={
                  isLoggedIn ? (
                    <Navigate to={isAdmin ? "/admin" : "/"} />
                  ) : (
                    <SignIn setIsLoggedIn={setIsLoggedIn} setIsAdmin={setIsAdmin} />
                  )
                }
              />
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<MyCart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/orders" element={<OrdersW />} />
              <Route path="/order-detail/:id" element={<OrderDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route
                  path="/admin"
                  element={
                    isLoggedIn && isAdmin ? (
                      <LayoutAdmin />
                    ) : (
                      <Navigate to={isLoggedIn ? "/" : "/sign-in"} />
                    )
                  }
                >
                <Route index element={<Statistic />} />
                <Route path="categories" element={<Categories />} />
                <Route path="orders" element={<Orders />} />
                <Route path="orders/:id" element={<OrderDetailManage />} />
                <Route path="products" element={<Products />} />
                <Route path="products/add" element={<ProductAdd />} />
                <Route path="products/edit/:id" element={<ProductAdd />} />
                <Route path="suppliers" element={<SuppliersPage />} />
                <Route path="toppings" element={<ToppingsPage />} />
                <Route path="ingredients" element={<IngredientsPage />} />
                <Route path="warehouse" element={<Warehouse />} />
                <Route path="order-ingredients" element={<OrderIngredientsPage />} /> 
                <Route path="design" element={<Design />} />
                <Route path="marketing" element={<Marketing />} />
                <Route path="store-setting" element={<StoreSetting />} />
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
