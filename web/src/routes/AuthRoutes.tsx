import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Index from "@/pages/Index";
import VerifyAccount from "@/pages/auth/VerifyAccount";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import { UserProfile } from "@/pages/profile/UserProfile";
import DeleteAccountInfo from "@/pages/profile/DeleteAccountInfo";
import NotFound from "@/pages/NotFound";
import BrowseItems from "@/pages/items/BrowseItems";
import PostItem from "@/pages/items/PostItem";
const AuthRoutes = {
  children: [
    {
      path: "/",
      element: <Index />,
    },
    {
      path: "/browse",
      element: <BrowseItems />,
    },
    {
      path: "/post",
      element: <PostItem />,
    },

    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/verify-account",
      element: <VerifyAccount />,
    },
    {
      path: "/privacy-policy",
      element: <PrivacyPolicy />,
    },
    {
      path: "/profile",
      element: <UserProfile />,
    },
    {
      path: "/account-deletion-info",
      element: <DeleteAccountInfo />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
};

export default AuthRoutes;
