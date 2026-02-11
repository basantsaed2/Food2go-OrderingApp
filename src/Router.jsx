// import React from "react";
// import { createBrowserRouter } from "react-router-dom";
// import App from "./App";
// import Home from "./Pages/Home/Home";
// import LoginPage from "./Pages/Authentication/Login";
// import Products from "./Pages/Products/Product";
// import LandingPage from "./Pages/LandingPage/LandingPage";
// import Menu from "./Pages/Menu/Menu";
// import Branch from "./Pages/Branch/Branch";
// import Cart from "./Pages/Cart/Cart";
// import FavoriteProducts from "./Pages/FavoriteProducts/FavoriteProducts";
// import OrderType from "./Pages/OrderType/OrderType";
// import AddNewAddress from "./Pages/OrderType/AddNewAddress";
// import CheckOut from "./Pages/CheckOut/CheckOut";
// import OrderTraking from "./Pages/OrderTracking/OrderTracking";
// import Profile from "./Pages/Profile/Profile";
// import SignUpPage from "./Pages/Authentication/SignUp";
// import ProtectedLogin from "./ProtectedData/ProtectedLogin";
// import MyOrderTracking from "./Pages/OrderTracking/MyOrderTracking";
// import Support from "./Pages/SupportPrivacy/Support";
// import PrivacyPolicy from "./Pages/SupportPrivacy/PrivacyPolicy";
// import ElectronicMenu from "./Pages/ElectronicMenu/ElectronicMenu";
// import ElectronicMenuLanding from "./Pages/ElectronicMenu/ElectronicMenuLanding";

// export const router = createBrowserRouter([
//   {
//     path: "",
//     element: <App />,
//     children: [
//       // Public routes
//       {
//         path: "",
//         element: <LandingPage />,
//       },
//       {
//         path: "home",
//         element: <Home />,
//       },
//       {
//         path: "menu",
//         element: <Menu />,
//       },
//       {
//         path: "branches",
//         element: <Branch />,
//       },
//       {
//         path: "products/:id",
//         element: <Products />,
//       },
//       {
//         path: "products",
//         element: <Products />,
//       },
//       {
//         path: "order_online",
//         element: <OrderType />
//       },
//       {
//         path: "support",
//         element: <Support />
//       },
//       {
//         path: "policy",
//         element: <PrivacyPolicy />
//       },
//       {
//         path: "electronic_menu",
//         element: <ElectronicMenuLanding />
//       },
//       {
//         path: "electronic_menu/items",
//         element: <ElectronicMenu />
//       },


//       // Guest-only (auth pages)
//       {
//         path: "",
//         element: <ProtectedLogin />, // checks if user exists → redirect to "/"
//         children: [
//           { path: "login", element: <LoginPage /> },
//           { path: "signup", element: <SignUpPage /> },
//         ],
//       },

//       // Protected routes (require user login)
//       {
//         path: "",
//         element: <ProtectedLogin />, // checks if !user → redirect to "/login"
//         children: [
//           { path: "profile", element: <Profile /> },
//           { path: "cart", element: <Cart /> },
//           { path: "favorite_product", element: <FavoriteProducts /> },
//           { path: "add_address", element: <AddNewAddress /> },
//           { path: "check_out", element: <CheckOut /> },
//           { path: "order_traking/:orderId", element: <OrderTraking /> },
//           { path: "orders", element: <MyOrderTracking /> },
//         ],
//       },
//     ],
//   },
// ]);




import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from "./Pages/Home/Home";
import LoginPage from "./Pages/Authentication/Login";
import Products from "./Pages/Products/Product";
import LandingPage from "./Pages/LandingPage/LandingPage";
import Menu from "./Pages/Menu/Menu";
import Branch from "./Pages/Branch/Branch";
import Cart from "./Pages/Cart/Cart";
import FavoriteProducts from "./Pages/FavoriteProducts/FavoriteProducts";
import OrderType from "./Pages/OrderType/OrderType";
import AddNewAddress from "./Pages/OrderType/AddNewAddress";
import CheckOut from "./Pages/CheckOut/CheckOut";
import OrderTraking from "./Pages/OrderTracking/OrderTracking";
import Profile from "./Pages/Profile/Profile";
import SignUpPage from "./Pages/Authentication/SignUp";
import ProtectedLogin from "./ProtectedData/ProtectedLogin";
import MyOrderTracking from "./Pages/OrderTracking/MyOrderTracking";
import Support from "./Pages/SupportPrivacy/Support";
import PrivacyPolicy from "./Pages/SupportPrivacy/PrivacyPolicy";
import ElectronicMenu from "./Pages/ElectronicMenu/ElectronicMenu";
import ElectronicMenuLanding from "./Pages/ElectronicMenu/ElectronicMenuLanding";
import ProtectedOrderRoute from "./ProtectedData/ProtectedOrderRoute";

export const router = createBrowserRouter([
  {
    path: "",
    element: <App />,
    children: [
      // Public routes
      {
        path: "",
        element: <LandingPage />,
      },
      {
        path: "menu",
        element: <Menu />,
      },
      {
        path: "support",
        element: <Support />
      },
      {
        path: "policy",
        element: <PrivacyPolicy />
      },
      {
        path: "electronic_menu",
        element: <ElectronicMenuLanding />
      },
      {
        path: "electronic_menu/items",
        element: <ElectronicMenu />
      },

      // Protected Ordering Routes (Disabled when order_online === 0)
      {
        path: "",
        element: <ProtectedOrderRoute />,
        children: [
          {
            path: "home",
            element: <Home />,
          },
          {
            path: "branches",
            element: <Branch />,
          },
          {
            path: "products/:id",
            element: <Products />,
          },
          {
            path: "products",
            element: <Products />,
          },
          {
            path: "order_online",
            element: <OrderType />
          },
        ]
      },


      // Guest-only (auth pages)
      {
        path: "",
        element: <ProtectedLogin />, // checks if user exists → redirect to "/"
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <SignUpPage /> },
        ],
      },

      // Protected routes (require user login)
      {
        path: "",
        element: <ProtectedLogin />, // checks if !user → redirect to "/login"
        children: [
          { path: "profile", element: <Profile /> },
          // Ordering flows that require login AND ordering enabled
          {
            path: "",
            element: <ProtectedOrderRoute />,
            children: [
              { path: "cart", element: <Cart /> },
              { path: "favorite_product", element: <FavoriteProducts /> },
              { path: "add_address", element: <AddNewAddress /> },
              { path: "check_out", element: <CheckOut /> },
              { path: "order_traking/:orderId", element: <OrderTraking /> },
              { path: "orders", element: <MyOrderTracking /> },
            ]
          }
        ],
      },
    ],
  },
]);
